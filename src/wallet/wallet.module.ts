import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WalletService } from './wallet.service';
import { WalletResolver } from './wallet.resolver';
import { MockWalletProviderService } from './mock-wallet-provider.service';
import { WALLET_PROVIDER } from './interfaces/wallet-provider.interface';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [
    WalletService,
    WalletResolver,
    MockWalletProviderService,
    {
      provide: WALLET_PROVIDER,
      useExisting: MockWalletProviderService,
    },
  ],
  exports: [WalletService],
})
export class WalletModule {}
