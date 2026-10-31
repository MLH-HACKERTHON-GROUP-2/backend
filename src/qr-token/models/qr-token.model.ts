import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('QrToken')
export class QrTokenModel {
  @Field(() => ID)
  token: string;

  @Field()
  qrCodeUrl: string;

  @Field()
  expiresAt: Date;
}
