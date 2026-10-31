import { Injectable } from '@nestjs/common';
import { Hospital, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { appError } from '../common/errors/app.errors';
import { UsersService } from '../users/users.service';
import { WalletOwnerType } from '../wallet/enums/wallet.enums';
import { OnboardHospitalInput } from './dto/onboard-hospital.dto';
import { HospitalModel } from './models/hospital.model';

@Injectable()
export class HospitalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async onboardHospital(input: OnboardHospitalInput): Promise<Hospital> {
    const adminUser = await this.usersService.createUser(Role.HOSPITAL_ADMIN, input.adminName, input.adminIdentifier);

    return this.prisma.hospital.create({
      data: {
        name: input.name,
        address: input.address,
        consultationFee: input.consultationFee,
        adminUserId: adminUser.id,
        wallet: { create: { ownerType: WalletOwnerType.HOSPITAL, balance: 0 } },
      },
    });
  }

  async findByAdminUserId(adminUserId: string): Promise<Hospital> {
    const hospital = await this.prisma.hospital.findUnique({ where: { adminUserId } });
    if (!hospital) {
      throw appError('NOT_FOUND', 'No hospital found for this admin.');
    }
    return hospital;
  }

  async findById(id: string): Promise<Hospital> {
    const hospital = await this.prisma.hospital.findUnique({ where: { id } });
    if (!hospital) {
      throw appError('NOT_FOUND', 'Hospital not found.');
    }
    return hospital;
  }

  async findAll(): Promise<Hospital[]> {
    return this.prisma.hospital.findMany();
  }

  toModel(hospital: Hospital): HospitalModel {
    return {
      id: hospital.id,
      adminUserId: hospital.adminUserId,
      name: hospital.name,
      address: hospital.address,
      consultationFee: hospital.consultationFee,
      wallet: null as any,
      doctors: [] as any,
    };
  }
}
