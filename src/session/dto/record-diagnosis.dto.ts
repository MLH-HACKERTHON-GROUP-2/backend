import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class RecordDiagnosisInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  notes: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  code?: string;
}
