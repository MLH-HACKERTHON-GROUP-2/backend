import { WalletTransaction } from '@prisma/client';
import { WalletTransactionType } from '../enums/wallet.enums';

export interface WalletReference {
  referenceType: string;
  referenceId: string;
}

/**
 * Abstraction over "how money moves". MockWalletProvider is an in-house
 * Postgres ledger for the PoC; swapping to Devdraft later means writing a
 * new implementation of this interface, not touching any caller.
 */
export interface WalletProvider {
  getBalance(walletId: string): Promise<number>;

  credit(walletId: string, amount: number, type: WalletTransactionType, reference?: WalletReference): Promise<WalletTransaction>;

  /** Throws an INSUFFICIENT_FUNDS app error if balance < amount. */
  debit(walletId: string, amount: number, type: WalletTransactionType, reference?: WalletReference): Promise<WalletTransaction>;

  /** Atomically debits fromWalletId and credits toWalletId. */
  transfer(
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    type: WalletTransactionType,
    reference?: WalletReference,
  ): Promise<{ debit: WalletTransaction; credit: WalletTransaction }>;
}

export const WALLET_PROVIDER = Symbol('WALLET_PROVIDER');
