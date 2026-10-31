import { Injectable } from '@nestjs/common';
import { Diagnosis, Session, SessionStatus, Vitals } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { appError } from '../common/errors/app.errors';
import { QrTokenService } from '../qr-token/qr-token.service';
import { DoctorService } from '../doctor/doctor.service';
import { HospitalService } from '../hospital/hospital.service';
import { WalletService } from '../wallet/wallet.service';
import { WalletTransactionType } from '../wallet/enums/wallet.enums';
import { RecordVitalsInput } from './dto/record-vitals.dto';
import { RecordDiagnosisInput } from './dto/record-diagnosis.dto';
import { CreatePrescriptionInput } from './dto/create-prescription.dto';

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly qrTokenService: QrTokenService,
    private readonly doctorService: DoctorService,
    private readonly hospitalService: HospitalService,
    private readonly walletService: WalletService,
  ) {}

  async startSession(doctorUserId: string, qrToken: string): Promise<Session> {
    const patientId = await this.qrTokenService.resolve(qrToken);
    const doctor = await this.doctorService.findByUserId(doctorUserId);

    const lockKey = `session_lock:${patientId}`;
    const acquired = await this.redis.set(lockKey, '1', 'EX', 10, 'NX');

    if (!acquired) {
      throw appError('SESSION_ALREADY_ACTIVE', 'This patient already has an active session.');
    }

    try {
      const existingActive = await this.prisma.session.findFirst({
        where: { patientId, status: SessionStatus.ACTIVE },
      });

      if (existingActive) {
        throw appError('SESSION_ALREADY_ACTIVE', 'This patient already has an active session.');
      }

      return this.prisma.session.create({
        data: { patientId, doctorId: doctor.id, hospitalId: doctor.hospitalId },
      });
    } finally {
      await this.redis.del(lockKey);
    }
  }

  /** Throws NOT_FOUND / FORBIDDEN / SESSION_NOT_ACTIVE as appropriate. */
  async getOwnedActiveSession(doctorUserId: string, sessionId: string): Promise<Session> {
    const session = await this.findById(sessionId);
    const doctor = await this.doctorService.findByUserId(doctorUserId);

    if (session.doctorId !== doctor.id) {
      throw appError('FORBIDDEN', 'Only the doctor who started this session can modify it.');
    }

    if (session.status !== SessionStatus.ACTIVE) {
      throw appError('SESSION_NOT_ACTIVE', 'This session has already been finalized.');
    }

    return session;
  }

  async findById(id: string): Promise<Session> {
    const session = await this.prisma.session.findUnique({ where: { id } });
    if (!session) {
      throw appError('NOT_FOUND', 'Session not found.');
    }
    return session;
  }

  async findActiveForDoctorUser(doctorUserId: string): Promise<Session | null> {
    const doctor = await this.doctorService.findByUserId(doctorUserId);
    return this.prisma.session.findFirst({
      where: { doctorId: doctor.id, status: SessionStatus.ACTIVE },
    });
  }

  async recordVitals(doctorUserId: string, input: RecordVitalsInput): Promise<Vitals> {
    await this.getOwnedActiveSession(doctorUserId, input.sessionId);

    return this.prisma.vitals.upsert({
      where: { sessionId: input.sessionId },
      update: {
        temperature: input.temperature,
        bloodPressure: input.bloodPressure,
        pulse: input.pulse,
        weightKg: input.weightKg,
        notes: input.notes,
      },
      create: {
        sessionId: input.sessionId,
        temperature: input.temperature,
        bloodPressure: input.bloodPressure,
        pulse: input.pulse,
        weightKg: input.weightKg,
        notes: input.notes,
      },
    });
  }

  async recordDiagnosis(doctorUserId: string, input: RecordDiagnosisInput): Promise<Diagnosis> {
    await this.getOwnedActiveSession(doctorUserId, input.sessionId);

    return this.prisma.diagnosis.upsert({
      where: { sessionId: input.sessionId },
      update: { notes: input.notes, code: input.code },
      create: { sessionId: input.sessionId, notes: input.notes, code: input.code },
    });
  }

  async createPrescription(doctorUserId: string, input: CreatePrescriptionInput) {
    await this.getOwnedActiveSession(doctorUserId, input.sessionId);

    return this.prisma.$transaction(async (tx) => {
      const prescription = await tx.prescription.upsert({
        where: { sessionId: input.sessionId },
        update: {},
        create: { sessionId: input.sessionId },
      });

      await tx.prescriptionItem.deleteMany({ where: { prescriptionId: prescription.id } });

      await tx.prescriptionItem.createMany({
        data: input.items.map((item) => ({
          prescriptionId: prescription.id,
          drugName: item.drugName,
          dosage: item.dosage,
          quantity: item.quantity,
          instructions: item.instructions,
        })),
      });

      return tx.prescription.findUniqueOrThrow({
        where: { id: prescription.id },
        include: { items: true },
      });
    });
  }

  async finalizeSession(doctorUserId: string, sessionId: string): Promise<Session> {
    const session = await this.getOwnedActiveSession(doctorUserId, sessionId);
    const hospital = await this.hospitalService.findById(session.hospitalId);

    const patientWalletId = await this.walletService.findWalletIdByPatientId(session.patientId);
    const hospitalWalletId = await this.walletService.findWalletIdByHospitalId(session.hospitalId);

    // Throws INSUFFICIENT_FUNDS before any state changes if the patient
    // can't afford it — the session is left ACTIVE, nothing partial.
    await this.walletService.transfer(patientWalletId, hospitalWalletId, hospital.consultationFee, WalletTransactionType.CONSULTATION, {
      referenceType: 'SESSION',
      referenceId: session.id,
    });

    return this.prisma.session.update({
      where: { id: sessionId },
      data: { status: SessionStatus.FINALIZED, finalizedAt: new Date() },
    });
  }
}
