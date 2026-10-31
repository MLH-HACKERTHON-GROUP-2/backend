import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { HospitalModule } from '../hospital/hospital.module';
import { DoctorService } from './doctor.service';
import { DoctorResolver } from './doctor.resolver';

@Module({
  imports: [forwardRef(() => AuthModule), UsersModule, forwardRef(() => HospitalModule)],
  providers: [DoctorService, DoctorResolver],
  exports: [DoctorService],
})
export class DoctorModule {}
