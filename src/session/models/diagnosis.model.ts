import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('Diagnosis')
export class DiagnosisModel {
  @Field(() => ID)
  id: string;

  @Field()
  notes: string;

  @Field(() => String, { nullable: true })
  code: string | null;

  @Field()
  recordedAt: Date;
}
