import { Injectable } from '@nestjs/common';
import { Doctor, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { HospitalService } from '../hospital/hospital.service';
import { OnboardDoctorInput } from './dto/onboard-doctor.dto';
import { DoctorModel } from './models/doctor.model';

@Injectable()
export class DoctorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly hospitalService: HospitalService,
  ) {}

  async onboardDoctor(hospitalAdminUserId: string, input: OnboardDoctorInput): Promise<Doctor> {
    const hospital = await this.hospitalService.findByAdminUserId(hospitalAdminUserId);
    const doctorUser = await this.usersService.createUser(Role.DOCTOR, input.name, input.identifier);

    return this.prisma.doctor.create({
      data: { userId: doctorUser.id, hospitalId: hospital.id },
    });
  }

  toModel(doctor: Doctor): DoctorModel {
    return {
      id: doctor.id,
      userId: doctor.userId,
      hospitalId: doctor.hospitalId,
      user: null as any,
      hospital: null as any,
    };
  }
}
