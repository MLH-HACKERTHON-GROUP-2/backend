import { Injectable } from '@nestjs/common';
import { Patient, Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { appError } from '../common/errors/app.errors';
import { UserModel } from './models/user.model';

function splitIdentifier(identifier: string): { email: string | null; phone: string | null } {
  const isEmail = identifier.includes('@');
  return { email: isEmail ? identifier : null, phone: isEmail ? null : identifier };
}

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

  /** Generic onboarded-user creation (HOSPITAL_ADMIN, DOCTOR, PHARMACY) — the caller links the owning entity separately. */
  async createUser(role: Role, name: string, identifier: string): Promise<User> {
    const existing = await this.findByIdentifier(identifier);
    if (existing) {
      throw appError('IDENTIFIER_IN_USE', `${identifier} is already registered.`);
    }

    return this.prisma.user.create({
      data: { role, name, ...splitIdentifier(identifier) },
    });
  }

  /** Self-service signup path: first verifyOtp for an unknown identifier creates a PATIENT + wallet. */
  async createPatientUser(identifier: string): Promise<User> {
    return this.prisma.user.create({
      data: {
        role: Role.PATIENT,
        name: 'New Patient',
        ...splitIdentifier(identifier),
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
