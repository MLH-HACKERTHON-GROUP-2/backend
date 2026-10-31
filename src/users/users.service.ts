import { Injectable } from '@nestjs/common';
import { Patient, Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserModel } from './models/user.model';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdentifier(identifier: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async createPatientUser(identifier: string): Promise<User> {
    const isEmail = identifier.includes('@');

    return this.prisma.user.create({
      data: {
        role: Role.PATIENT,
        name: 'New Patient',
        email: isEmail ? identifier : null,
        phone: isEmail ? null : identifier,
        patient: {
          create: {
            wallet: {
              create: { ownerType: 'PATIENT', balance: 0 },
            },
          },
        },
      },
    });
  }

  async toModel(user: User): Promise<UserModel> {
    const profileComplete = await this.isProfileComplete(user);

    return {
      id: user.id,
      role: user.role,
      email: user.email,
      phone: user.phone,
      name: user.name,
      profileComplete,
      createdAt: user.createdAt,
    };
  }

  private async isProfileComplete(user: User): Promise<boolean> {
    if (user.role !== Role.PATIENT) {
      return true;
    }

    const patient: Patient | null = await this.prisma.patient.findUnique({
      where: { userId: user.id },
    });

    return patient?.profileComplete ?? false;
  }
}
