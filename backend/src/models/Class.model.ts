import { Schema, model, Document } from 'mongoose';

export interface IClass extends Document {
  class_id: string;
  school_id: string;
  class_name: string;
  grade: string;
  subjects?: string[]; 
}

const classSchema = new Schema<IClass>({
  class_id: { type: String, required: true, unique: true },
  school_id: { type: String, required: true },
  class_name: { type: String, required: true },
  grade: { type: String, required: true },
  subjects: { 
    type: [String], 
    default: ['Mathematics', 'Physics', 'Chemistry', 'English', 'Computer Science', 'Biology'] 
  } 
}, { timestamps: true });

export const ClassModel = model<IClass>('Class', classSchema);