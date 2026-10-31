import { Field, ID, ObjectType } from '@nestjs/graphql';
import { PrescriptionItemModel } from './prescription-item.model';

@ObjectType('Prescription')
export class PrescriptionModel {
  @Field(() => ID)
  id: string;

  @Field(() => [PrescriptionItemModel])
  items: PrescriptionItemModel[];

  @Field()
  createdAt: Date;
}
