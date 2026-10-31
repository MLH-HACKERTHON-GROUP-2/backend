import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { WalletModule } from '../wallet/wallet.module';
import { HospitalService } from './hospital.service';
import { HospitalResolver } from './hospital.resolver';

@Module({
  imports: [forwardRef(() => AuthModule), UsersModule, WalletModule],
  providers: [HospitalService, HospitalResolver],
  exports: [HospitalService],
})
export class HospitalModule {}
