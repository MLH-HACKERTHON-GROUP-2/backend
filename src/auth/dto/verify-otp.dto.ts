import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class VerifyOtpInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  otp: string;
}
