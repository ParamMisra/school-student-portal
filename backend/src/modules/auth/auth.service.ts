import { UserModel } from '../../models/User.model';
import bcrypt from 'bcryptjs';
import { generateAccessToken } from '../../utils/helpers';
import { UserRole } from '../../constants/enums';

export class AuthService {
  static async registerAdmin(data: { user_id: string; school_id: string; name: string; email: string; password: string }) {
    const existingUser = await UserModel.findOne({ email: data.email });
    if (existingUser) throw new Error('User with this email already exists');

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
    const user = await UserModel.findOne({ email });
    if (!user) throw new Error('User not found');

    if (user.role !== targetRole) {
      throw new Error(`Access denied. Expected role: ${targetRole}`);
    }

    const isMatch = await bcrypt.compare(pass, user.password_hash);
    if (!isMatch) throw new Error('Invalid credentials');

    // 1. Calculate default password dynamically: emailPrefix + "123"
    const emailPrefix = user.email.split('@')[0];
    const defaultPassword = `${emailPrefix}123`;

    // 2. Determine if user needs password change (Admin/Teacher using default password)
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
}