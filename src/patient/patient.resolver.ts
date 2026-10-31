import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';
import { Roles } from '../rbac/roles.decorator';
import { Role } from '../rbac/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import { UserModel } from '../users/models/user.model';
import { WalletModel } from '../wallet/models/wallet.model';
import { SessionModel } from '../session/models/session.model';
import { PatientService } from './patient.service';
import { PatientModel } from './models/patient.model';
import { CompletePatientProfileInput } from './dto/complete-patient-profile.dto';

@Resolver(() => PatientModel)
export class PatientResolver {
  constructor(
    private readonly patientService: PatientService,
    private readonly usersService: UsersService,
    private readonly walletService: WalletService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => PatientModel)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  async myPatientProfile(@CurrentUser() user: JwtPayload): Promise<PatientModel> {
    const patient = await this.patientService.findByUserId(user.sub);
    return this.patientService.toModel(patient);
  }

  @Mutation(() => PatientModel)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  async completePatientProfile(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: CompletePatientProfileInput,
  ): Promise<PatientModel> {
    const patient = await this.patientService.completeProfile(user.sub, input);
    return this.patientService.toModel(patient);
  }

  @ResolveField(() => UserModel)
  async user(@Parent() patient: PatientModel): Promise<UserModel> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: patient.userId } });
    return this.usersService.toModel(user);
  }

  @ResolveField(() => WalletModel)
  async wallet(@Parent() patient: PatientModel): Promise<WalletModel> {
    const wallet = await this.prisma.wallet.findUniqueOrThrow({ where: { patientId: patient.id } });
    return this.walletService.toModel(wallet);
  }

  @ResolveField(() => [SessionModel])
  async sessions(@Parent() patient: PatientModel): Promise<SessionModel[]> {
    const sessions = await this.prisma.session.findMany({ where: { patientId: patient.id } });
    return sessions.map(
      (s) =>
        ({
          id: s.id,
          patientId: s.patientId,
          doctorId: s.doctorId,
          hospitalId: s.hospitalId,
          status: s.status,
          startedAt: s.startedAt,
          finalizedAt: s.finalizedAt,
          patient: null,
          doctor: null,
          hospital: null,
          vitals: null,
          diagnosis: null,
          prescription: null,
        }) as unknown as SessionModel,
    );
  }
}
