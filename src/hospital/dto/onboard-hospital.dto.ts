import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

@InputType()
export class OnboardHospitalInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  address?: string;

  @Field()
  @IsNumber()
  @Min(0)
  consultationFee: number;

  @Field()
  @IsString()
  @IsNotEmpty()
  adminName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  adminIdentifier: string;
}
