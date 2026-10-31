import { Injectable } from '@nestjs/common';
import { Pharmacy, PharmacyDrugPrice, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { appError } from '../common/errors/app.errors';
import { UsersService } from '../users/users.service';
import { WalletOwnerType } from '../wallet/enums/wallet.enums';
import { OnboardPharmacyInput } from './dto/onboard-pharmacy.dto';
import { SetPharmacyDrugPriceInput } from './dto/set-pharmacy-drug-price.dto';
import { PharmacyModel } from './models/pharmacy.model';

@Injectable()
export class PharmacyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async onboardPharmacy(input: OnboardPharmacyInput): Promise<Pharmacy> {
    const user = await this.usersService.createUser(Role.PHARMACY, input.userName, input.userIdentifier);

    return this.prisma.pharmacy.create({
      data: {
        name: input.name,
        address: input.address,
        userId: user.id,
        wallet: { create: { ownerType: WalletOwnerType.PHARMACY, balance: 0 } },
      },
    });
  }

  async findByUserId(userId: string): Promise<Pharmacy> {
    const pharmacy = await this.prisma.pharmacy.findUnique({ where: { userId } });
    if (!pharmacy) {
      throw appError('NOT_FOUND', 'No pharmacy found for this user.');
    }
    return pharmacy;
  }

  async findById(id: string): Promise<Pharmacy> {
    const pharmacy = await this.prisma.pharmacy.findUnique({ where: { id } });
    if (!pharmacy) {
      throw appError('NOT_FOUND', 'Pharmacy not found.');
    }
    return pharmacy;
  }

  async findAll(): Promise<Pharmacy[]> {
    return this.prisma.pharmacy.findMany();
  }

  async setDrugPrice(pharmacyId: string, input: SetPharmacyDrugPriceInput): Promise<PharmacyDrugPrice> {
    return this.prisma.pharmacyDrugPrice.upsert({
      where: { pharmacyId_drugName: { pharmacyId, drugName: input.drugName } },
      update: { price: input.price },
      create: { pharmacyId, drugName: input.drugName, price: input.price },
    });
  }

  toModel(pharmacy: Pharmacy): PharmacyModel {
    return {
      id: pharmacy.id,
      userId: pharmacy.userId,
      name: pharmacy.name,
      address: pharmacy.address,
      wallet: null as any,
      drugPrices: [] as any,
    };
  }
}
