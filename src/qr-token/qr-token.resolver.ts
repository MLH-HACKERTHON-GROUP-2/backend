import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';
import { Roles } from '../rbac/roles.decorator';
import { Role } from '../rbac/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { PatientService } from '../patient/patient.service';
import { PatientModel } from '../patient/models/patient.model';
import { QrTokenService } from './qr-token.service';
import { QrTokenModel } from './models/qr-token.model';

@Resolver()
export class QrTokenResolver {
  constructor(
    private readonly qrTokenService: QrTokenService,
    private readonly patientService: PatientService,
  ) {}

  @Mutation(() => QrTokenModel)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  async generateQrToken(@CurrentUser() user: JwtPayload): Promise<QrTokenModel> {
    const patient = await this.patientService.findByUserId(user.sub);
    return this.qrTokenService.generate(patient.id);
  }

  @Query(() => PatientModel)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR, Role.PHARMACY)
  async patientByQrToken(@Args('token', { type: () => ID }) token: string): Promise<PatientModel> {
    const patientId = await this.qrTokenService.resolve(token);
    const patient = await this.patientService.findById(patientId);
    return this.patientService.toModel(patient);
  }
}
