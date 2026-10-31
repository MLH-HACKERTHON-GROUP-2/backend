# Build Phases — Health System PoC

Companion to [PRD.md](PRD.md) and [schema.graphql](schema.graphql). Each phase is independently demoable and builds on the last — don't start a phase until the previous one's acceptance criteria pass. Module layout for each phase follows [.cursor/rules/architecture.mdc](.cursor/rules/architecture.mdc).

## Phase 0 — Project Scaffolding
**Goal**: an empty but runnable NestJS + GraphQL + Prisma + Redis skeleton.

- NestJS project init, `src/app.module.ts`, `src/main.ts`
- `PrismaModule` + `prisma/schema.prisma` (datasource only, no models yet) + Postgres running (docker-compose)
- Redis connection module (`src/common/redis/`) + Redis running (docker-compose)
- GraphQL module wired (`@nestjs/graphql` + `@nestjs/apollo`, code-first, schema auto-generated to `src/schema.gql`)
- `docker-compose.yml` for local Postgres + Redis
- `.env.example` with `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `DEMO_MODE=true`

**Acceptance**: `yarn start:dev` boots, GraphQL Playground loads at `/graphql` with an empty schema, Prisma can connect to Postgres.

## Phase 1 — Auth, RBAC, Core Prisma Schema
**Goal**: every role can log in; roles are enforced on resolvers.

- Full `prisma/schema.prisma`: `User`, `Patient`, `Hospital`, `Doctor`, `Pharmacy`, `Wallet` (enums: `Role`, `WalletOwnerType`) — rest of the schema (`Session`, `Vitals`, etc.) can wait until Phase 3, but add now if trivial.
- `src/otp/` — `requestOtp`/`verifyOtp`, hardcoded `000000` (gated behind `DEMO_MODE`)
- `src/auth/` — JWT issuance (access 15min / refresh 7day), `refreshToken` mutation, `GqlAuthGuard`
- `src/rbac/` — `Role` enum, `@Roles()` decorator, `RolesGuard`
- `src/users/` — `User` model/resolver, `me` query
- Seed script: one `SYSTEM_ADMIN` user

**Acceptance**: `requestOtp` → `verifyOtp` → `me` round-trip works for a seeded admin; a role-gated test query returns `FORBIDDEN` for the wrong role.

## Phase 2 — Onboarding Chain + Wallets
**Goal**: the full Admin→Hospital→Doctor / Admin→Pharmacy / self-serve Patient chain exists, every actor has a wallet.

- `src/wallet/` — `WalletProvider` interface + `MockWalletProvider`, `Wallet`/`WalletTransaction` Prisma models, `topUpWallet` mutation, auto-create wallet on onboarding
- `src/hospital/` — `onboardHospital` mutation (role: SYSTEM_ADMIN), `myHospital` query
- `src/pharmacy/` — `onboardPharmacy` mutation (role: SYSTEM_ADMIN), `myPharmacy` query, `PharmacyDrugPrice` model + `setPharmacyDrugPrice`
- `src/doctor/` — `onboardDoctor` mutation (role: HOSPITAL_ADMIN)
- `src/patient/` — self-serve signup (reuses `verifyOtp`), `completePatientProfile`, `User.profileComplete` flag, `myPatientProfile` query
- `allHospitals`/`allPharmacies` queries (role: SYSTEM_ADMIN)

**Acceptance**: a full chain can be exercised manually — admin onboards a hospital + pharmacy, hospital admin onboards a doctor, a patient self-signs-up and completes their profile; all five wallets exist with balance 0; `topUpWallet` moves a patient's balance.

## Phase 3 — Dynamic QR Tokens
**Goal**: patients can generate a short-lived, rotating lookup token; doctors/pharmacies can resolve it.

- `src/qr-token/` (or inside `src/patient/`) — Redis-backed `generateQrToken` mutation (TTL 2 min, `qr_token:{token}` + reverse pointer `patient_qr_token:{patientId}` for rotation)
- `patientByQrToken(token)` query (role: DOCTOR, PHARMACY) with `TOKEN_EXPIRED`/`TOKEN_NOT_FOUND` error codes

**Acceptance**: generate a token, resolve it as a doctor within 2 minutes (succeeds), resolve the same token after 2 minutes (fails `TOKEN_EXPIRED`); generating a second token invalidates the first immediately.

## Phase 4 — Session Lifecycle
**Goal**: a doctor can run a full session against a patient.

- `prisma/schema.prisma` additions: `Session`, `Vitals`, `Diagnosis`, `Prescription`, `PrescriptionItem` + partial unique index enforcing one `ACTIVE` session per patient
- `src/session/` — `startSession(qrToken)` (re-validates token, Redis lock for the uniqueness constraint), `recordVitals`/`recordDiagnosis`/`createPrescription` as upserts scoped to `ACTIVE` sessions, `finalizeSession`
- `myActiveSession`/`session(id)` queries (role: DOCTOR)
- `SESSION_ALREADY_ACTIVE` / `SESSION_NOT_ACTIVE` error codes

**Acceptance**: doctor starts a session, edits vitals/diagnosis/prescription multiple times, finalizes — all fields become immutable after finalize; starting a second session for the same patient while one is active fails.

## Phase 5 — Consultation Payment
**Goal**: finalizing a session moves money.

- Wire `finalizeSession` to debit patient wallet / credit hospital wallet by `Hospital.consultationFee`, writing `WalletTransaction` rows (type `CONSULTATION`)
- Block finalize with `INSUFFICIENT_FUNDS` if balance too low (session stays `ACTIVE`, no partial state)

**Acceptance**: finalize succeeds and both wallets/ledgers update atomically when funded; finalize fails cleanly and session remains `ACTIVE` when the patient has insufficient balance.

## Phase 6 — Pharmacy Fulfillment + Medication Payment
**Goal**: pharmacies can dispense finalized prescriptions and get paid.

- `pendingPrescriptionItems(qrToken)` query (role: PHARMACY) — only items from `FINALIZED` sessions, status `PENDING`
- `dispensePrescriptionItem(itemId)` mutation — looks up pharmacy's own `PharmacyDrugPrice` for that drug (`PRICE_NOT_SET` if missing), debits patient / credits pharmacy, marks item `DISPENSED`
- `ALREADY_DISPENSED` guard for double-dispense races

**Acceptance**: a finalized session's prescription items are invisible to pharmacies before finalize, visible after; dispensing charges the correct wallet pair and flips status; insufficient funds blocks cleanly; dispensing an already-dispensed item fails.

## Phase 7 — Realtime Notifications
**Goal**: all the events in PRD §5.5 fire over GraphQL subscriptions.

- Redis pub/sub adapter wired into `@nestjs/graphql` subscriptions (`graphql-ws`)
- Publish on: `sessionStarted`, `sessionFinalized`, `prescriptionReady`, `prescriptionDispensed`, `myPaymentEvents` (success + failure), `onboardingNotice`
- WS auth via `connectionParams` JWT

**Acceptance**: subscribing as the relevant patient/hospital-admin/doctor/pharmacy user in GraphQL Playground and triggering the corresponding mutation in another session delivers the event within ~1s.

## Phase 8 — End-to-End Demo Script
**Goal**: a repeatable, scripted walkthrough of the whole system for a live demo.

- A Postman collection or `.http`/GraphQL Playground script that runs, in order: admin onboards hospital+pharmacy → hospital onboards doctor → patient signs up → patient tops up wallet → patient generates QR → doctor scans, starts session, records vitals/diagnosis/prescription, finalizes → pharmacy scans, dispenses → subscriptions observed firing throughout
- README section: "Running the demo"

**Acceptance**: a person unfamiliar with the code can follow the script top to bottom and see every PRD flow work, including at least one deliberately triggered `INSUFFICIENT_FUNDS` and one `TOKEN_EXPIRED` case.

---

## Suggested Parallelization

Phases 0–2 are sequential (each depends on the last). Once Phase 2 is done, a second engineer can start Phase 3 (QR) while the first continues into Phase 4 (sessions) — Phase 4 only needs Phase 3's `patientByQrToken`/token validation contract, not its implementation. Phase 5 and 6 can likewise be split once Phase 4 lands. Phase 7 (realtime) is best done by whoever isn't blocked, threading events into each phase's mutations as they land rather than as one big bang at the end — the PRD's event table (§5.5) tells you exactly which mutation fires which event.
