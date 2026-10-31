import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('PharmacyDrugPrice')
export class PharmacyDrugPriceModel {
  @Field(() => ID)
  id: string;

  @Field()
  drugName: string;

  @Field()
  price: number;
}
