import { registerEnumType } from '@nestjs/graphql';
import { WalletOwnerType, WalletTransactionDirection, WalletTransactionType } from '@prisma/client';

export { WalletOwnerType, WalletTransactionDirection, WalletTransactionType };

registerEnumType(WalletOwnerType, { name: 'WalletOwnerType' });
registerEnumType(WalletTransactionType, { name: 'WalletTransactionType' });
registerEnumType(WalletTransactionDirection, { name: 'WalletTransactionDirection' });
