import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { PrescriptionItemStatus } from '../enums/session.enums';
import { PharmacyModel } from '../../pharmacy/models/pharmacy.model';

@ObjectType('PrescriptionItem')
export class PrescriptionItemModel {
  @Field(() => ID)
  id: string;

  prescriptionId: string;

  @Field()
  drugName: string;

  @Field()
  dosage: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => String, { nullable: true })
  instructions: string | null;

  @Field(() => PrescriptionItemStatus)
  status: PrescriptionItemStatus;

  dispensedById: string | null;

  @Field(() => PharmacyModel, { nullable: true })
  dispensedBy: PharmacyModel | null;

  @Field(() => Date, { nullable: true })
  dispensedAt: Date | null;
}
