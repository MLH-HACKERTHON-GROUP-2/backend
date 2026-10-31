import { Injectable } from '@nestjs/common';
import { Patient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { appError } from '../common/errors/app.errors';
import { CompletePatientProfileInput } from './dto/complete-patient-profile.dto';
import { PatientModel } from './models/patient.model';

@Injectable()
export class PatientService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<Patient> {
    const patient = await this.prisma.patient.findUnique({ where: { userId } });
    if (!patient) {
      throw appError('NOT_FOUND', 'Patient profile not found.');
    }
    return patient;
  }

  async findByPublicId(publicId: string): Promise<Patient> {
    const patient = await this.prisma.patient.findUnique({ where: { publicId } });
    if (!patient) {
      throw appError('NOT_FOUND', 'Patient not found.');
    }
    return patient;
  }

  async findById(id: string): Promise<Patient> {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      throw appError('NOT_FOUND', 'Patient not found.');
    }
    return patient;
  }

  async completeProfile(userId: string, input: CompletePatientProfileInput): Promise<Patient> {
    const [, patient] = await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { name: input.name } }),
      this.prisma.patient.update({
        where: { userId },
        data: {
          dob: input.dob,
          sex: input.sex,
          allergies: input.allergies,
          profileComplete: true,
        },
      }),
    ]);

    return patient;
  }

  toModel(patient: Patient): PatientModel {
    return {
      id: patient.id,
      userId: patient.userId,
      publicId: patient.publicId,
      dob: patient.dob,
      sex: patient.sex,
      allergies: patient.allergies,
      user: null as any,
      wallet: null as any,
      sessions: [] as any,
    };
  }
}
