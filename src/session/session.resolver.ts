import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Diagnosis, Prescription, PrescriptionItem, Session, Vitals } from '@prisma/client';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';
import { Roles } from '../rbac/roles.decorator';
import { Role } from '../rbac/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { PatientService } from '../patient/patient.service';
import { PatientModel } from '../patient/models/patient.model';
import { DoctorService } from '../doctor/doctor.service';
import { DoctorModel } from '../doctor/models/doctor.model';
import { HospitalService } from '../hospital/hospital.service';
import { HospitalModel } from '../hospital/models/hospital.model';
import { SessionService } from './session.service';
import { SessionModel } from './models/session.model';
import { VitalsModel } from './models/vitals.model';
import { DiagnosisModel } from './models/diagnosis.model';
import { PrescriptionModel } from './models/prescription.model';
import { RecordVitalsInput } from './dto/record-vitals.dto';
import { RecordDiagnosisInput } from './dto/record-diagnosis.dto';
import { CreatePrescriptionInput } from './dto/create-prescription.dto';

function toSessionModel(session: Session): SessionModel {
  return {
    id: session.id,
    patientId: session.patientId,
    doctorId: session.doctorId,
    hospitalId: session.hospitalId,
    status: session.status,
    startedAt: session.startedAt,
    finalizedAt: session.finalizedAt,
    patient: null as any,
    doctor: null as any,
    hospital: null as any,
    vitals: null,
    diagnosis: null,
    prescription: null,
  };
}

function toVitalsModel(vitals: Vitals): VitalsModel {
  return {
    id: vitals.id,
    temperature: vitals.temperature,
    bloodPressure: vitals.bloodPressure,
    pulse: vitals.pulse,
    weightKg: vitals.weightKg,
    notes: vitals.notes,
    recordedAt: vitals.recordedAt,
  };
}

function toDiagnosisModel(diagnosis: Diagnosis): DiagnosisModel {
  return {
    id: diagnosis.id,
    notes: diagnosis.notes,
    code: diagnosis.code,
    recordedAt: diagnosis.recordedAt,
  };
}

function toPrescriptionModel(prescription: Prescription & { items: PrescriptionItem[] }): PrescriptionModel {
  return {
    id: prescription.id,
    createdAt: prescription.createdAt,
    items: prescription.items.map((item) => ({
      id: item.id,
      prescriptionId: item.prescriptionId,
      drugName: item.drugName,
      dosage: item.dosage,
      quantity: item.quantity,
      instructions: item.instructions,
      status: item.status,
      dispensedById: item.dispensedById,
      dispensedBy: null,
      dispensedAt: item.dispensedAt,
    })),
  };
}

@Resolver(() => SessionModel)
export class SessionResolver {
  constructor(
    private readonly sessionService: SessionService,
    private readonly patientService: PatientService,
    private readonly doctorService: DoctorService,
    private readonly hospitalService: HospitalService,
    private readonly prisma: PrismaService,
  ) {}

  @Mutation(() => SessionModel)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  async startSession(@CurrentUser() user: JwtPayload, @Args('qrToken', { type: () => ID }) qrToken: string): Promise<SessionModel> {
    const session = await this.sessionService.startSession(user.sub, qrToken);
    return toSessionModel(session);
  }

  @Mutation(() => VitalsModel)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  async recordVitals(@CurrentUser() user: JwtPayload, @Args('input') input: RecordVitalsInput): Promise<VitalsModel> {
    const vitals = await this.sessionService.recordVitals(user.sub, input);
    return toVitalsModel(vitals);
  }

  @Mutation(() => DiagnosisModel)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  async recordDiagnosis(@CurrentUser() user: JwtPayload, @Args('input') input: RecordDiagnosisInput): Promise<DiagnosisModel> {
    const diagnosis = await this.sessionService.recordDiagnosis(user.sub, input);
    return toDiagnosisModel(diagnosis);
  }

  @Mutation(() => PrescriptionModel)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  async createPrescription(@CurrentUser() user: JwtPayload, @Args('input') input: CreatePrescriptionInput): Promise<PrescriptionModel> {
    const prescription = await this.sessionService.createPrescription(user.sub, input);
    return toPrescriptionModel(prescription);
  }

  @Mutation(() => SessionModel)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  async finalizeSession(@CurrentUser() user: JwtPayload, @Args('sessionId', { type: () => ID }) sessionId: string): Promise<SessionModel> {
    const session = await this.sessionService.finalizeSession(user.sub, sessionId);
    return toSessionModel(session);
  }

  @Query(() => SessionModel, { nullable: true })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  async myActiveSession(@CurrentUser() user: JwtPayload): Promise<SessionModel | null> {
    const session = await this.sessionService.findActiveForDoctorUser(user.sub);
    return session ? toSessionModel(session) : null;
  }

  @Query(() => SessionModel)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  async session(@Args('id', { type: () => ID }) id: string): Promise<SessionModel> {
    const session = await this.sessionService.findById(id);
    return toSessionModel(session);
  }

  @ResolveField(() => PatientModel)
  async patient(@Parent() session: SessionModel): Promise<PatientModel> {
    const patient = await this.patientService.findById(session.patientId);
    return this.patientService.toModel(patient);
  }

  @ResolveField(() => DoctorModel)
  async doctor(@Parent() session: SessionModel): Promise<DoctorModel> {
    const doctor = await this.doctorService.findById(session.doctorId);
    return this.doctorService.toModel(doctor);
  }

  @ResolveField(() => HospitalModel)
  async hospital(@Parent() session: SessionModel): Promise<HospitalModel> {
    const hospital = await this.hospitalService.findById(session.hospitalId);
    return this.hospitalService.toModel(hospital);
  }

  @ResolveField(() => VitalsModel, { nullable: true })
  async vitals(@Parent() session: SessionModel): Promise<VitalsModel | null> {
    const vitals = await this.prisma.vitals.findUnique({ where: { sessionId: session.id } });
    return vitals ? toVitalsModel(vitals) : null;
  }

  @ResolveField(() => DiagnosisModel, { nullable: true })
  async diagnosis(@Parent() session: SessionModel): Promise<DiagnosisModel | null> {
    const diagnosis = await this.prisma.diagnosis.findUnique({ where: { sessionId: session.id } });
    return diagnosis ? toDiagnosisModel(diagnosis) : null;
  }

  @ResolveField(() => PrescriptionModel, { nullable: true })
  async prescription(@Parent() session: SessionModel): Promise<PrescriptionModel | null> {
    const prescription = await this.prisma.prescription.findUnique({
      where: { sessionId: session.id },
      include: { items: true },
    });
    return prescription ? toPrescriptionModel(prescription) : null;
  }
}
