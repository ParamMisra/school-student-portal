import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User.model';
import { connectDatabase } from '../config/db';

const seedAdmin = async () => {
  await connectDatabase();

  const adminEmail = 'admin@school.com';
  const existingAdmin = await UserModel.findOne({ email: adminEmail });

  if (existingAdmin) {
    console.log('⚠️ Admin user already exists!');
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash('Admin@123456', 10);

  await UserModel.create({
    user_id: 'ADM001',
    school_id: 'SCH001',
    name: 'System Administrator',
    email: adminEmail,
    role: 'admin',
    password_hash: hashedPassword,
  });

  console.log('✅ Super Admin created successfully!');
  console.log('📧 Email: admin@school.com');
  console.log('🔑 Password: Admin@123456');

  process.exit(0);
};

seedAdmin();