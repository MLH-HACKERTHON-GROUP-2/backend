import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Role } from '../../rbac/role.enum';

@ObjectType('User')
export class UserModel {
  @Field(() => ID)
  id: string;

  @Field(() => Role)
  role: Role;

  @Field(() => String, { nullable: true })
  email: string | null;

  @Field(() => String, { nullable: true })
  phone: string | null;

  @Field()
  name: string;

  @Field()
  profileComplete: boolean;

  @Field()
  createdAt: Date;
}
