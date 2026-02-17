/**
 * Email notifications for account activities.
 * Set SMTP env vars to send real emails; otherwise tokens are returned in API response (dev).
 */

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  try {
    const nodemailer = require('nodemailer');
    return nodemailer.createTransport({
      host,
      port: port || 587,
      secure: port === '465',
      auth: { user, pass },
    });
  } catch (e) {
    return null;
  }
};

const from = process.env.SMTP_FROM || 'LeadsHer <noreply@leadsher.com>';
const appUrl = process.env.APP_URL || 'http://localhost:3000';

const sendEmail = async ({ to, subject, html, text }) => {
  const transport = getTransporter();
  if (!transport) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Email stub]', { to, subject, text: text || html?.replace(/<[^>]*>/g, '') });
    }
    return { sent: false };
  }
  await transport.sendMail({ from, to, subject, html, text: text || html?.replace(/<[^>]*>/g, '') });
  return { sent: true };
};

const sendVerificationEmail = async (email, token) => {
  const link = `${appUrl}/verify-email?token=${token}`;
  const html = `Welcome to LeadsHer. Please verify your email: <a href="${link}">Verify Email</a>. Link expires in 24 hours.`;
  return sendEmail({
    to: email,
    subject: 'Verify your LeadsHer email',
    html,
    text: `Verify your email: ${link}`,
  });
};

const sendPasswordResetEmail = async (email, token) => {
  const link = `${appUrl}/reset-password?token=${token}`;
  const html = `Reset your LeadsHer password: <a href="${link}">Reset Password</a>. Link expires in 10 minutes.`;
  return sendEmail({
    to: email,
    subject: 'Reset your LeadsHer password',
    html,
    text: `Reset password: ${link}`,
  });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail, getTransporter };
