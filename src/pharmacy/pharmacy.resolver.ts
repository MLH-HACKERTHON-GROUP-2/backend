import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';
import { Roles } from '../rbac/roles.decorator';
import { Role } from '../rbac/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { WalletModel } from '../wallet/models/wallet.model';
import { PharmacyService } from './pharmacy.service';
import { PharmacyModel } from './models/pharmacy.model';
import { PharmacyDrugPriceModel } from './models/pharmacy-drug-price.model';
import { OnboardPharmacyInput } from './dto/onboard-pharmacy.dto';
import { SetPharmacyDrugPriceInput } from './dto/set-pharmacy-drug-price.dto';

@Resolver(() => PharmacyModel)
export class PharmacyResolver {
  constructor(
    private readonly pharmacyService: PharmacyService,
    private readonly walletService: WalletService,
    private readonly prisma: PrismaService,
  ) {}

  @Mutation(() => PharmacyModel)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN)
  async onboardPharmacy(@Args('input') input: OnboardPharmacyInput): Promise<PharmacyModel> {
    const pharmacy = await this.pharmacyService.onboardPharmacy(input);
    return this.pharmacyService.toModel(pharmacy);
  }

  @Mutation(() => PharmacyDrugPriceModel)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.PHARMACY)
  async setPharmacyDrugPrice(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: SetPharmacyDrugPriceInput,
  ): Promise<PharmacyDrugPriceModel> {
    const pharmacy = await this.pharmacyService.findByUserId(user.sub);
    return this.pharmacyService.setDrugPrice(pharmacy.id, input);
  }

  @Query(() => PharmacyModel)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.PHARMACY)
  async myPharmacy(@CurrentUser() user: JwtPayload): Promise<PharmacyModel> {
    const pharmacy = await this.pharmacyService.findByUserId(user.sub);
    return this.pharmacyService.toModel(pharmacy);
  }

  @Query(() => [PharmacyModel])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN)
  async allPharmacies(): Promise<PharmacyModel[]> {
    const pharmacies = await this.pharmacyService.findAll();
    return pharmacies.map((p) => this.pharmacyService.toModel(p));
  }

  @ResolveField(() => WalletModel)
  async wallet(@Parent() pharmacy: PharmacyModel): Promise<WalletModel> {
    const wallet = await this.prisma.wallet.findUniqueOrThrow({ where: { pharmacyId: pharmacy.id } });
    return this.walletService.toModel(wallet);
  }

  @ResolveField(() => [PharmacyDrugPriceModel])
  async drugPrices(@Parent() pharmacy: PharmacyModel): Promise<PharmacyDrugPriceModel[]> {
    return this.prisma.pharmacyDrugPrice.findMany({ where: { pharmacyId: pharmacy.id } });
  }
}
