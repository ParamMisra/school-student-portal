import { Schema, model, Document, Types } from 'mongoose';

export interface ITimeTable extends Document {
  timetable_id: string;
  class_id: string; // e.g. "201"
  school_id: string;
  teacher_id: Types.ObjectId;
  substitute_id?: Types.ObjectId;
  period: number; // 1 to 6
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
  subject: string;
}

const timetableSchema = new Schema<ITimeTable>({
  timetable_id: { type: String, required: true, unique: true },
  class_id: { type: String, required: true },
  school_id: { type: String, required: true },
  teacher_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  substitute_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  period: { type: Number, required: true, min: 1, max: 6 },
  day: { type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], required: true },
  subject: { type: String, required: true },
}, { timestamps: true });

export const TimeTableModel = model<ITimeTable>('TimeTable', timetableSchema);