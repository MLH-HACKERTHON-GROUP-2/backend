import { Field, InputType } from '@nestjs/graphql';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class CompletePatientProfileInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field(() => Date, { nullable: true })
  @IsDateString()
  @IsOptional()
  dob?: Date;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  sex?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  allergies?: string;
}
