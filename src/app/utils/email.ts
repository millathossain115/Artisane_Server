import nodemailer from 'nodemailer';
import config from '../config/index.js';
import AppError from '../errors/appError.js';

const getTransporter = () => {
  const { from, host, pass, port, user } = config.smtp;

  if (!host || !user || !pass || !from) {
    throw new AppError(500, 'SMTP email credentials are not configured');
  }

  return nodemailer.createTransport({
    auth: {
      pass,
      user,
    },
    host,
    port,
    secure: port === 465,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetLink: string,
) => {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: config.smtp.from,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #181512;">
        <h2>Reset your Artisane password</h2>
        <p>Hello ${name || 'there'},</p>
        <p>Use the link below to reset your password. It expires soon.</p>
        <p><a href="${resetLink}" style="display:inline-block;background:#181512;color:#ffffff;padding:12px 18px;text-decoration:none;font-weight:700;">Reset password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
    subject: 'Reset your Artisane password',
    text: `Reset your Artisane password: ${resetLink}`,
    to: email,
  });
};
