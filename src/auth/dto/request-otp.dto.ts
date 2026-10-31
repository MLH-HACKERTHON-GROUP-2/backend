import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class RequestOtpInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  identifier: string;
}
