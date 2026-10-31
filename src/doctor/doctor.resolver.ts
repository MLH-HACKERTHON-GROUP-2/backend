import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';
import { Roles } from '../rbac/roles.decorator';
import { Role } from '../rbac/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { HospitalService } from '../hospital/hospital.service';
import { HospitalModel } from '../hospital/models/hospital.model';
import { UserModel } from '../users/models/user.model';
import { DoctorService } from './doctor.service';
import { DoctorModel } from './models/doctor.model';
import { OnboardDoctorInput } from './dto/onboard-doctor.dto';

@Resolver(() => DoctorModel)
export class DoctorResolver {
  constructor(
    private readonly doctorService: DoctorService,
    private readonly usersService: UsersService,
    private readonly hospitalService: HospitalService,
    private readonly prisma: PrismaService,
  ) {}

  @Mutation(() => DoctorModel)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.HOSPITAL_ADMIN)
  async onboardDoctor(@CurrentUser() user: JwtPayload, @Args('input') input: OnboardDoctorInput): Promise<DoctorModel> {
    const doctor = await this.doctorService.onboardDoctor(user.sub, input);
    return this.doctorService.toModel(doctor);
  }

  @ResolveField(() => UserModel)
  async user(@Parent() doctor: DoctorModel): Promise<UserModel> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: doctor.userId } });
    return this.usersService.toModel(user);
  }

  @ResolveField(() => HospitalModel)
  async hospital(@Parent() doctor: DoctorModel): Promise<HospitalModel> {
    const hospital = await this.hospitalService.findById(doctor.hospitalId);
    return this.hospitalService.toModel(hospital);
  }
}
