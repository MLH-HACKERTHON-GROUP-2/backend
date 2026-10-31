import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class OnboardPharmacyInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  address?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  userName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  userIdentifier: string;
}
