import { Schema, model, Document } from 'mongoose';

export interface ISchool extends Document {
  school_id: string;
  school_name: string;
  location: string;
}

const schoolSchema = new Schema<ISchool>({
  school_id: { type: String, required: true, unique: true },
  school_name: { type: String, required: true },
  location: { type: String, required: true },
}, { timestamps: true });

export const SchoolModel = model<ISchool>('School', schoolSchema);