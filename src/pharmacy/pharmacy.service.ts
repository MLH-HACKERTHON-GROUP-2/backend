import { Injectable } from '@nestjs/common';
import { Pharmacy, PharmacyDrugPrice, PrescriptionItem, Role, SessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { appError } from '../common/errors/app.errors';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import { WalletOwnerType, WalletTransactionType } from '../wallet/enums/wallet.enums';
import { QrTokenService } from '../qr-token/qr-token.service';
import { OnboardPharmacyInput } from './dto/onboard-pharmacy.dto';
import { SetPharmacyDrugPriceInput } from './dto/set-pharmacy-drug-price.dto';
import { PharmacyModel } from './models/pharmacy.model';

@Injectable()
export class PharmacyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly walletService: WalletService,
    private readonly qrTokenService: QrTokenService,
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

  async pendingItemsForQrToken(qrToken: string): Promise<PrescriptionItem[]> {
    const patientId = await this.qrTokenService.resolve(qrToken);

    return this.prisma.prescriptionItem.findMany({
      where: {
        status: 'PENDING',
        prescription: { session: { patientId, status: SessionStatus.FINALIZED } },
      },
    });
  }

  async dispenseItem(pharmacyUserId: string, itemId: string): Promise<PrescriptionItem> {
    const pharmacy = await this.findByUserId(pharmacyUserId);

    const item = await this.prisma.prescriptionItem.findUnique({
      where: { id: itemId },
      include: { prescription: { include: { session: true } } },
    });

    if (!item) {
      throw appError('NOT_FOUND', 'Prescription item not found.');
    }

    if (item.status === 'DISPENSED') {
      throw appError('ALREADY_DISPENSED', 'This item has already been dispensed.');
    }

    if (item.prescription.session.status !== SessionStatus.FINALIZED) {
      throw appError('NOT_FOUND', 'Prescription item not found.');
    }

    const price = await this.prisma.pharmacyDrugPrice.findUnique({
      where: { pharmacyId_drugName: { pharmacyId: pharmacy.id, drugName: item.drugName } },
    });

    if (!price) {
      throw appError('PRICE_NOT_SET', `This pharmacy has not set a price for ${item.drugName}.`);
    }

    const patientWalletId = await this.walletService.findWalletIdByPatientId(item.prescription.session.patientId);
    const pharmacyWalletId = await this.walletService.findWalletIdByPharmacyId(pharmacy.id);

    // Funds move first, while the item is still PENDING, so an
    // INSUFFICIENT_FUNDS failure leaves it untouched. The status flip right
    // after is not re-checked against a concurrent dispense of the same
    // item (no optimistic lock) — acceptable for this PoC's traffic, but a
    // true race could double-charge. The initial status check above is what
    // makes a *sequential* double-dispense fail with ALREADY_DISPENSED.
    await this.walletService.transfer(patientWalletId, pharmacyWalletId, price.price, WalletTransactionType.MEDICATION, {
      referenceType: 'PRESCRIPTION_ITEM',
      referenceId: item.id,
    });

    return this.prisma.prescriptionItem.update({
      where: { id: itemId },
      data: { status: 'DISPENSED', dispensedById: pharmacy.id, dispensedAt: new Date() },
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
