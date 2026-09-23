import { Schema, model, Document, Types } from 'mongoose';
import { AttendanceStatus } from '../constants/enums';

export interface IAttendanceLog extends Document {
  log_id: string;
  student_id: Types.ObjectId;
  subject: string;
  date: Date;
  status: AttendanceStatus;
}

const attendanceLogSchema = new Schema<IAttendanceLog>({
  log_id: { type: String, required: true, unique: true },
  student_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: Object.values(AttendanceStatus), required: true },
}, { timestamps: true });

export const AttendanceLogModel = model<IAttendanceLog>('AttendanceLog', attendanceLogSchema);