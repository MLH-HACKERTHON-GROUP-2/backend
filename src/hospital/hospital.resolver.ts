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
import { HospitalService } from './hospital.service';
import { HospitalModel } from './models/hospital.model';
import { OnboardHospitalInput } from './dto/onboard-hospital.dto';
import { DoctorModel } from '../doctor/models/doctor.model';
import { WalletModel } from '../wallet/models/wallet.model';

@Resolver(() => HospitalModel)
export class HospitalResolver {
  constructor(
    private readonly hospitalService: HospitalService,
    private readonly walletService: WalletService,
    private readonly prisma: PrismaService,
  ) {}

  @Mutation(() => HospitalModel)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN)
  async onboardHospital(@Args('input') input: OnboardHospitalInput): Promise<HospitalModel> {
    const hospital = await this.hospitalService.onboardHospital(input);
    return this.hospitalService.toModel(hospital);
  }

  @Query(() => HospitalModel)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.HOSPITAL_ADMIN)
  async myHospital(@CurrentUser() user: JwtPayload): Promise<HospitalModel> {
    const hospital = await this.hospitalService.findByAdminUserId(user.sub);
    return this.hospitalService.toModel(hospital);
  }

  @Query(() => [HospitalModel])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN)
  async allHospitals(): Promise<HospitalModel[]> {
    const hospitals = await this.hospitalService.findAll();
    return hospitals.map((h) => this.hospitalService.toModel(h));
  }

  @ResolveField(() => WalletModel)
  async wallet(@Parent() hospital: HospitalModel): Promise<WalletModel> {
    const wallet = await this.prisma.wallet.findUniqueOrThrow({ where: { hospitalId: hospital.id } });
    return this.walletService.toModel(wallet);
  }

  @ResolveField(() => [DoctorModel])
  async doctors(@Parent() hospital: HospitalModel): Promise<DoctorModel[]> {
    const doctors = await this.prisma.doctor.findMany({ where: { hospitalId: hospital.id } });
    return doctors.map((d) => ({ id: d.id, userId: d.userId, hospitalId: d.hospitalId }) as DoctorModel);
  }
}
