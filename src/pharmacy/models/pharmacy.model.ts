import { Field, ID, ObjectType } from '@nestjs/graphql';
import { WalletModel } from '../../wallet/models/wallet.model';
import { PharmacyDrugPriceModel } from './pharmacy-drug-price.model';

@ObjectType('Pharmacy')
export class PharmacyModel {
  @Field(() => ID)
  id: string;

  userId: string;

  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  address: string | null;

  @Field(() => WalletModel)
  wallet: WalletModel;

  @Field(() => [PharmacyDrugPriceModel])
  drugPrices: PharmacyDrugPriceModel[];
}
