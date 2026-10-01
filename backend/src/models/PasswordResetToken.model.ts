import { Schema, model, Document } from 'mongoose';

export interface IPasswordResetToken extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true, expires: 600 }
}, { timestamps: true });

export const PasswordResetTokenModel = model<IPasswordResetToken>('PasswordResetToken', passwordResetTokenSchema);