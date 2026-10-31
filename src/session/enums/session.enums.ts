import { registerEnumType } from '@nestjs/graphql';
import { PrescriptionItemStatus, SessionStatus } from '@prisma/client';

export { PrescriptionItemStatus, SessionStatus };

registerEnumType(SessionStatus, { name: 'SessionStatus' });
registerEnumType(PrescriptionItemStatus, { name: 'PrescriptionItemStatus' });
