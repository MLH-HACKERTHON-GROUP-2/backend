import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { WalletModule } from '../wallet/wallet.module';
import { QrTokenModule } from '../qr-token/qr-token.module';
import { PharmacyService } from './pharmacy.service';
import { PharmacyResolver, PrescriptionItemResolver } from './pharmacy.resolver';

@Module({
  imports: [forwardRef(() => AuthModule), UsersModule, WalletModule, QrTokenModule],
  providers: [PharmacyService, PharmacyResolver, PrescriptionItemResolver],
  exports: [PharmacyService],
})
export class PharmacyModule {}
