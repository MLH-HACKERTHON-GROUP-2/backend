import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UserModel } from './models/user.model';
import type { JwtPayload } from '../auth/jwt-payload.interface';

@Resolver(() => UserModel)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => UserModel)
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() currentUser: JwtPayload): Promise<UserModel> {
    const user = await this.usersService.findById(currentUser.sub);
    return this.usersService.toModel(user!);
  }
}
