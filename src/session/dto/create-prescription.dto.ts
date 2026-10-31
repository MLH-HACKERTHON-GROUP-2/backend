import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class PrescriptionItemInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  drugName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  dosage: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  instructions?: string;
}

@InputType()
export class CreatePrescriptionInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @Field(() => [PrescriptionItemInput])
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemInput)
  items: PrescriptionItemInput[];
}
