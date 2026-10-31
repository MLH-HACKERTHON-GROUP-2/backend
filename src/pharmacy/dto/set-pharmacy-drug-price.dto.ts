import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

@InputType()
export class SetPharmacyDrugPriceInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  drugName: string;

  @Field()
  @IsNumber()
  @Min(0)
  price: number;
}
