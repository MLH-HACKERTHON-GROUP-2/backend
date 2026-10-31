import { Field, ID, ObjectType } from '@nestjs/graphql';
import { WalletTransactionDirection, WalletTransactionType } from '../enums/wallet.enums';

@ObjectType('WalletTransaction')
export class WalletTransactionModel {
  @Field(() => ID)
  id: string;

  @Field(() => WalletTransactionType)
  type: WalletTransactionType;

  @Field(() => WalletTransactionDirection)
  direction: WalletTransactionDirection;

  @Field()
  amount: number;

  @Field(() => ID, { nullable: true })
  counterpartyWalletId: string | null;

  @Field(() => String, { nullable: true })
  referenceType: string | null;

  @Field(() => ID, { nullable: true })
  referenceId: string | null;

  @Field()
  createdAt: Date;
}
