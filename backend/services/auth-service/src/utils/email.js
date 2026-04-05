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
  const pink = '#db2777';
  const pinkText = '#9d174d';
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#fdf2f8;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fdf2f8;padding:28px 16px 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:480px;background-color:#ffffff;border:1px solid #fbcfe8;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="padding:28px 24px 8px 24px;text-align:center;">
              <p style="margin:0;font-size:36px;font-weight:800;letter-spacing:-0.04em;color:${pinkText};line-height:1.1;">LeadsHer</p>
              <p style="margin:10px 0 0 0;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${pink};">Password reset</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px 8px 24px;color:#374151;font-size:15px;line-height:1.6;">
              <p style="margin:0 0 12px 0;">Hi,</p>
              <p style="margin:0 0 24px 0;">We received a request to reset your LeadsHer password. Tap the button below to choose a new password.</p>
              <p style="margin:0 0 28px 0;text-align:center;">
                <a href="${link}" style="display:inline-block;padding:14px 36px;background-color:${pink};color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">Reset password</a>
              </p>
              <p style="margin:0 0 8px 0;font-size:13px;color:#6b7280;">Or paste this link into your browser:</p>
              <p style="margin:0 0 20px 0;font-size:12px;word-break:break-all;line-height:1.45;"><a href="${link}" style="color:${pink};text-decoration:underline;">${link}</a></p>
              <p style="margin:0;font-size:13px;color:#6b7280;">This link expires in <strong style="color:${pinkText};">10 minutes</strong>. If you did not request this, you can ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 24px 24px;background-color:#fff1f2;border-top:1px solid #fce7f3;">
              <p style="margin:0;font-size:12px;color:${pinkText};text-align:center;line-height:1.5;">LeadsHer — account security</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return sendEmail({
    to: email,
    subject: 'Reset your LeadsHer password',
    html,
    text: `Reset your LeadsHer password (expires in 10 minutes): ${link}\n\nIf you did not request this, ignore this email.`,
  });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail, getTransporter };
