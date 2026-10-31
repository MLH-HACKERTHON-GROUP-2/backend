import { Field, ID, ObjectType } from '@nestjs/graphql';
import { WalletOwnerType } from '../enums/wallet.enums';
import { WalletTransactionModel } from './wallet-transaction.model';

@ObjectType('Wallet')
export class WalletModel {
  @Field(() => ID)
  id: string;

  @Field(() => WalletOwnerType)
  ownerType: WalletOwnerType;

  @Field()
  balance: number;

  @Field(() => [WalletTransactionModel])
  transactions: WalletTransactionModel[];
}
