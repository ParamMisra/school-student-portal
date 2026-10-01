import nodemailer from 'nodemailer';

export const sendOTPNotice = async (email: string, otp: string) => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error(
      `SMTP credentials missing! USER: ${user ? 'Loaded' : 'MISSING'}, PASS: ${pass ? 'Loaded' : 'MISSING'}. Check backend/.env and restart server.`
    );
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"School System" <${user}>`,
    to: email,
    subject: 'Password Reset OTP Verification',
    text: `Your password reset verification code is: ${otp}. It will expire in 10 minutes.`,
    html: `<h3>Password Reset Request</h3><p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
  });
};