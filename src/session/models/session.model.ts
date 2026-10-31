import { Field, ID, ObjectType } from '@nestjs/graphql';
import { SessionStatus } from '../enums/session.enums';
import { PatientModel } from '../../patient/models/patient.model';
import { DoctorModel } from '../../doctor/models/doctor.model';
import { HospitalModel } from '../../hospital/models/hospital.model';
import { VitalsModel } from './vitals.model';
import { DiagnosisModel } from './diagnosis.model';
import { PrescriptionModel } from './prescription.model';

@ObjectType('Session')
export class SessionModel {
  @Field(() => ID)
  id: string;

  patientId: string;
  doctorId: string;
  hospitalId: string;

  @Field(() => PatientModel)
  patient: PatientModel;

  @Field(() => DoctorModel)
  doctor: DoctorModel;

  @Field(() => HospitalModel)
  hospital: HospitalModel;

  @Field(() => SessionStatus)
  status: SessionStatus;

  @Field()
  startedAt: Date;

  @Field(() => Date, { nullable: true })
  finalizedAt: Date | null;

  @Field(() => VitalsModel, { nullable: true })
  vitals: VitalsModel | null;

  @Field(() => DiagnosisModel, { nullable: true })
  diagnosis: DiagnosisModel | null;

  @Field(() => PrescriptionModel, { nullable: true })
  prescription: PrescriptionModel | null;
}
