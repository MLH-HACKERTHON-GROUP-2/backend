import { Injectable } from '@nestjs/common';
import { WalletTransaction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { appError } from '../common/errors/app.errors';
import { WalletProvider, WalletReference } from './interfaces/wallet-provider.interface';
import { WalletTransactionDirection, WalletTransactionType } from './enums/wallet.enums';

@Injectable()
export class MockWalletProviderService implements WalletProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(walletId: string): Promise<number> {
    const wallet = await this.prisma.wallet.findUniqueOrThrow({ where: { id: walletId } });
    return wallet.balance;
  }

  async credit(
    walletId: string,
    amount: number,
    type: WalletTransactionType,
    reference?: WalletReference,
  ): Promise<WalletTransaction> {
    const [, transaction] = await this.prisma.$transaction([
      this.prisma.wallet.update({ where: { id: walletId }, data: { balance: { increment: amount } } }),
      this.prisma.walletTransaction.create({
        data: {
          walletId,
          type,
          direction: WalletTransactionDirection.CREDIT,
          amount,
          referenceType: reference?.referenceType,
          referenceId: reference?.referenceId,
        },
      }),
    ]);

    return transaction;
  }

  async debit(
    walletId: string,
    amount: number,
    type: WalletTransactionType,
    reference?: WalletReference,
  ): Promise<WalletTransaction> {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: walletId } });

      if (wallet.balance < amount) {
        throw appError('INSUFFICIENT_FUNDS', 'Wallet balance is too low for this transaction.');
      }

      await tx.wallet.update({ where: { id: walletId }, data: { balance: { decrement: amount } } });

      return tx.walletTransaction.create({
        data: {
          walletId,
          type,
          direction: WalletTransactionDirection.DEBIT,
          amount,
          referenceType: reference?.referenceType,
          referenceId: reference?.referenceId,
        },
      });
    });
  }

  async transfer(
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    type: WalletTransactionType,
    reference?: WalletReference,
  ): Promise<{ debit: WalletTransaction; credit: WalletTransaction }> {
    return this.prisma.$transaction(async (tx) => {
      const fromWallet = await tx.wallet.findUniqueOrThrow({ where: { id: fromWalletId } });

      if (fromWallet.balance < amount) {
        throw appError('INSUFFICIENT_FUNDS', 'Wallet balance is too low for this transaction.');
      }

      await tx.wallet.update({ where: { id: fromWalletId }, data: { balance: { decrement: amount } } });
      await tx.wallet.update({ where: { id: toWalletId }, data: { balance: { increment: amount } } });

      const debit = await tx.walletTransaction.create({
        data: {
          walletId: fromWalletId,
          type,
          direction: WalletTransactionDirection.DEBIT,
          amount,
          counterpartyWalletId: toWalletId,
          referenceType: reference?.referenceType,
          referenceId: reference?.referenceId,
        },
      });

      const credit = await tx.walletTransaction.create({
        data: {
          walletId: toWalletId,
          type,
          direction: WalletTransactionDirection.CREDIT,
          amount,
          counterpartyWalletId: fromWalletId,
          referenceType: reference?.referenceType,
          referenceId: reference?.referenceId,
        },
      });

      return { debit, credit };
    });
  }
}
