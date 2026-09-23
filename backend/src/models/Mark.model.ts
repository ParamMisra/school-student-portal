import { Schema, model, Document, Types } from 'mongoose';

export interface IMark extends Document {
  mark_id: string;
  student_id: Types.ObjectId;
  subject: string;
  marks_obtained: number;
  total_marks: number;
  date: Date;
}

const markSchema = new Schema<IMark>({
  mark_id: { type: String, required: true, unique: true },
  student_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  marks_obtained: { type: Number, required: true },
  total_marks: { type: Number, required: true },
  date: { type: Date, required: true },
}, { timestamps: true });

export const MarkModel = model<IMark>('Mark', markSchema);