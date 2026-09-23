import { Schema, model, Document, Types } from 'mongoose';

export interface IAttendancePercentage extends Document {
  percentage_id: string;
  student_id: Types.ObjectId;
  subject: string;
  classes_attended: number;
  total_classes: number;
  attendance_percentage: number;
}

const attendancePercentageSchema = new Schema<IAttendancePercentage>({
  percentage_id: { type: String, required: true, unique: true },
  student_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  classes_attended: { type: Number, default: 0 },
  total_classes: { type: Number, default: 0 },
  attendance_percentage: { type: Number, default: 0 },
}, { timestamps: true });

export const AttendancePercentageModel = model<IAttendancePercentage>('AttendancePercentage', attendancePercentageSchema);