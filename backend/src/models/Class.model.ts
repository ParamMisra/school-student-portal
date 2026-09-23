import { Schema, model, Document, Types } from 'mongoose';

export interface IClass extends Document {
  class_id: string;
  school_id: Types.ObjectId;
  class_name: string;
  grade: string;
}

const classSchema = new Schema<IClass>({
  class_id: { type: String, required: true, unique: true },
  school_id: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  class_name: { type: String, required: true },
  grade: { type: String, required: true },
}, { timestamps: true });

export const ClassModel = model<IClass>('Class', classSchema);