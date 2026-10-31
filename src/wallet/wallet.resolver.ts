import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';
import { Roles } from '../rbac/roles.decorator';
import { Role } from '../rbac/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { WalletService } from './wallet.service';
import { WalletModel } from './models/wallet.model';
import { WalletTransactionModel } from './models/wallet-transaction.model';
import { PrismaService } from '../prisma/prisma.service';

@Resolver(() => WalletModel)
export class WalletResolver {
  constructor(
    private readonly walletService: WalletService,
    private readonly prisma: PrismaService,
  ) {}

  @Mutation(() => WalletModel)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.PATIENT, Role.HOSPITAL_ADMIN, Role.PHARMACY)
  async topUpWallet(@CurrentUser() user: JwtPayload, @Args('amount') amount: number): Promise<WalletModel> {
    const walletId = await this.walletService.getOwnWalletId(user);
    const wallet = await this.walletService.topUp(walletId, amount);
    return this.walletService.toModel(wallet);
  }

  @ResolveField(() => [WalletTransactionModel])
  async transactions(@Parent() wallet: WalletModel): Promise<WalletTransactionModel[]> {
    const rows = await this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      direction: row.direction,
      amount: row.amount,
      counterpartyWalletId: row.counterpartyWalletId,
      referenceType: row.referenceType,
      referenceId: row.referenceId,
      createdAt: row.createdAt,
    }));
  }
}
