import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { RequestOtpInput } from './dto/request-otp.dto';
import { VerifyOtpInput } from './dto/verify-otp.dto';
import { AuthPayloadModel } from './dto/auth-payload.model';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => Boolean)
  async requestOtp(@Args('input') input: RequestOtpInput): Promise<boolean> {
    return this.authService.requestOtp(input.identifier);
  }

  @Mutation(() => AuthPayloadModel)
  async verifyOtp(@Args('input') input: VerifyOtpInput): Promise<AuthPayloadModel> {
    return this.authService.verifyOtp(input.identifier, input.otp);
  }

  @Mutation(() => AuthPayloadModel)
  async refreshToken(@Args('refreshToken') refreshToken: string): Promise<AuthPayloadModel> {
    return this.authService.refreshToken(refreshToken);
  }
}
