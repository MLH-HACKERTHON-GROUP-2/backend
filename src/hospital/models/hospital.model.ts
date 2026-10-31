import { Field, ID, ObjectType } from '@nestjs/graphql';
import { WalletModel } from '../../wallet/models/wallet.model';
import { DoctorModel } from '../../doctor/models/doctor.model';

@ObjectType('Hospital')
export class HospitalModel {
  @Field(() => ID)
  id: string;

  adminUserId: string;

  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  address: string | null;

  @Field()
  consultationFee: number;

  @Field(() => WalletModel)
  wallet: WalletModel;

  @Field(() => [DoctorModel])
  doctors: DoctorModel[];
}
