import { Schema, model, Document } from 'mongoose';
import { UserRole } from '../constants/enums';

export interface IUser extends Document {
  user_id: string;
  school_id: string;
  name: string;
  email: string;
  role: UserRole;
  password_hash: string;
  class_id?: string;
  subjects?: string[];
  googleId?: string;
}

const userSchema = new Schema<IUser>({
  user_id: { type: String, required: true, unique: true },
  school_id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: Object.values(UserRole), required: true },
  password_hash: { type: String, required: true },
  class_id: { type: String, required: false },
  subjects: { type: [String], default: [] },
  googleId: { type: String, unique: true, sparse: true } 
}, { timestamps: true });

export const UserModel = model<IUser>('User', userSchema);