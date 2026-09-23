import { Schema, model, Document, Types } from 'mongoose';

export interface ITimeTable extends Document {
  timetable_id: string;
  class_id: Types.ObjectId;
  teacher_id: Types.ObjectId;
  substitute_id?: Types.ObjectId;
  period: number; // 1-6
  day: string; // Mon-Fri
  subject: string;
}

const timetableSchema = new Schema<ITimeTable>({
  timetable_id: { type: String, required: true, unique: true },
  class_id: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  teacher_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  substitute_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  period: { type: Number, required: true, min: 1, max: 6 },
  day: { type: String, required: true },
  subject: { type: String, required: true },
}, { timestamps: true });

export const TimeTableModel = model<ITimeTable>('TimeTable', timetableSchema);