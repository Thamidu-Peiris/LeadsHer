/**
 * Email notifications for account activities.
 * Set SMTP_* env vars to send real mail; otherwise reset/verify fall back to dev (see authService).
 *
 * Works with any SMTP provider: Gmail (app password), SendGrid, Mailgun, Resend SMTP, Outlook, etc.
 */

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  try {
    const nodemailer = require('nodemailer');
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure =
      process.env.SMTP_SECURE === 'true' || String(port) === '465';
    /** Default true. Set SMTP_TLS_REJECT_UNAUTHORIZED=false only if you see "self-signed certificate in chain" (e.g. corporate SSL inspection). Less secure. */
    const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false';
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized },
      ...(secure
        ? {}
        : {
            requireTLS: process.env.SMTP_REQUIRE_TLS !== 'false',
          }),
    });
  } catch (e) {
    return null;
  }
};

const from = process.env.SMTP_FROM || 'LeadsHer <leadsher@keyhref.com>';
const appUrl = process.env.APP_URL || 'http://localhost:3000';

const sendEmail = async ({ to, subject, html, text }) => {
  const transport = getTransporter();
  if (!transport) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Email stub]', { to, subject, text: text || html?.replace(/<[^>]*>/g, '') });
    }
    return { sent: false };
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log('[email] From:', from);
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
  const link = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const html = `
    <p>Hi,</p>
    <p>We received a request to reset your LeadsHer password.</p>
    <p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#b8860b;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Reset password</a></p>
    <p style="color:#555;font-size:13px;">Or paste this link into your browser:<br/><span style="word-break:break-all;">${link}</span></p>
    <p style="color:#777;font-size:12px;">This link expires in 10 minutes. If you did not request this, you can ignore this email.</p>
  `;
  return sendEmail({
    to: email,
    subject: 'Reset your LeadsHer password',
    html,
    text: `Reset your LeadsHer password (expires in 10 minutes): ${link}`,
  });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail, getTransporter };
