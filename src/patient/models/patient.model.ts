import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserModel } from '../../users/models/user.model';
import { WalletModel } from '../../wallet/models/wallet.model';
import { SessionModel } from '../../session/models/session.model';

@ObjectType('Patient')
export class PatientModel {
  @Field(() => ID)
  id: string;

  userId: string;

  @Field(() => UserModel)
  user: UserModel;

  @Field(() => ID)
  publicId: string;

  @Field(() => Date, { nullable: true })
  dob: Date | null;

  @Field(() => String, { nullable: true })
  sex: string | null;

  @Field(() => String, { nullable: true })
  allergies: string | null;

  @Field(() => WalletModel)
  wallet: WalletModel;

  @Field(() => [SessionModel])
  sessions: SessionModel[];
}
