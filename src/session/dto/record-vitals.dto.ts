import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

@InputType()
export class RecordVitalsInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @Field(() => Number, { nullable: true })
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  bloodPressure?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  pulse?: number;

  @Field(() => Number, { nullable: true })
  @IsNumber()
  @IsOptional()
  weightKg?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}
