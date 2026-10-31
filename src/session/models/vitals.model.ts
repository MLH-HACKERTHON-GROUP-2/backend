import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('Vitals')
export class VitalsModel {
  @Field(() => ID)
  id: string;

  @Field(() => Number, { nullable: true })
  temperature: number | null;

  @Field(() => String, { nullable: true })
  bloodPressure: string | null;

  @Field(() => Int, { nullable: true })
  pulse: number | null;

  @Field(() => Number, { nullable: true })
  weightKg: number | null;

  @Field(() => String, { nullable: true })
  notes: string | null;

  @Field()
  recordedAt: Date;
}
