import { Inject, Injectable } from '@nestjs/common';
import { Wallet } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { appError } from '../common/errors/app.errors';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { Role } from '../rbac/role.enum';
import { WALLET_PROVIDER } from './interfaces/wallet-provider.interface';
import type { WalletProvider } from './interfaces/wallet-provider.interface';
import { WalletOwnerType, WalletTransactionType } from './enums/wallet.enums';
import { WalletModel } from './models/wallet.model';
import { WalletReference } from './interfaces/wallet-provider.interface';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WALLET_PROVIDER) private readonly provider: WalletProvider,
  ) {}

  async createWallet(ownerType: WalletOwnerType): Promise<Wallet> {
    return this.prisma.wallet.create({ data: { ownerType, balance: 0 } });
  }

  async findById(walletId: string): Promise<Wallet> {
    return this.prisma.wallet.findUniqueOrThrow({ where: { id: walletId } });
  }

  /** Resolves the wallet owned by the currently authenticated user (PATIENT, HOSPITAL_ADMIN, or PHARMACY). */
  async getOwnWalletId(user: JwtPayload): Promise<string> {
    if (user.role === Role.PATIENT) {
      const patient = await this.prisma.patient.findUnique({ where: { userId: user.sub }, include: { wallet: true } });
      if (!patient?.wallet) throw appError('NOT_FOUND', 'Patient wallet not found.');
      return patient.wallet.id;
    }

    if (user.role === Role.HOSPITAL_ADMIN) {
      const hospital = await this.prisma.hospital.findUnique({ where: { adminUserId: user.sub }, include: { wallet: true } });
      if (!hospital?.wallet) throw appError('NOT_FOUND', 'Hospital wallet not found.');
      return hospital.wallet.id;
    }

    if (user.role === Role.PHARMACY) {
      const pharmacy = await this.prisma.pharmacy.findUnique({ where: { userId: user.sub }, include: { wallet: true } });
      if (!pharmacy?.wallet) throw appError('NOT_FOUND', 'Pharmacy wallet not found.');
      return pharmacy.wallet.id;
    }

    throw appError('FORBIDDEN', 'This role does not own a wallet.');
  }

  async topUp(walletId: string, amount: number): Promise<Wallet> {
    await this.provider.credit(walletId, amount, WalletTransactionType.TOPUP);
    return this.findById(walletId);
  }

  async findWalletIdByPatientId(patientId: string): Promise<string> {
    const wallet = await this.prisma.wallet.findUniqueOrThrow({ where: { patientId } });
    return wallet.id;
  }

  async findWalletIdByHospitalId(hospitalId: string): Promise<string> {
    const wallet = await this.prisma.wallet.findUniqueOrThrow({ where: { hospitalId } });
    return wallet.id;
  }

  /** Throws INSUFFICIENT_FUNDS (via the provider) if fromWalletId's balance is too low. */
  async transfer(fromWalletId: string, toWalletId: string, amount: number, type: WalletTransactionType, reference: WalletReference) {
    return this.provider.transfer(fromWalletId, toWalletId, amount, type, reference);
  }

  async toModel(wallet: Wallet): Promise<WalletModel> {
    return {
      id: wallet.id,
      ownerType: wallet.ownerType,
      balance: wallet.balance,
      transactions: [],
    };
  }
}
