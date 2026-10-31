import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { WalletModule } from '../wallet/wallet.module';
import { PharmacyService } from './pharmacy.service';
import { PharmacyResolver } from './pharmacy.resolver';

@Module({
  imports: [forwardRef(() => AuthModule), UsersModule, WalletModule],
  providers: [PharmacyService, PharmacyResolver],
  exports: [PharmacyService],
})
export class PharmacyModule {}
