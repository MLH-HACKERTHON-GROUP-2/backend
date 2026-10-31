import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserModel } from '../../users/models/user.model';
import { HospitalModel } from '../../hospital/models/hospital.model';

@ObjectType('Doctor')
export class DoctorModel {
  @Field(() => ID)
  id: string;

  userId: string;
  hospitalId: string;

  @Field(() => UserModel)
  user: UserModel;

  @Field(() => HospitalModel)
  hospital: HospitalModel;
}
