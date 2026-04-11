/**
 * SMTP for event reminders (Brevo, Gmail, etc.).
 *
 * Brevo (example):
 *   SMTP_HOST=smtp-relay.brevo.com
 *   SMTP_PORT=587
 *   SMTP_SECURE=false
 *   SMTP_USER=your-login@example.com
 *   SMTP_PASS=your-smtp-key
 *   SMTP_FROM=LeadsHer <noreply@yourdomain.com>
 *   SMTP_REQUIRE_TLS=true
 * Optional:
 *   SMTP_TLS_REJECT_UNAUTHORIZED=true
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
    console.error('[event-email] transporter error:', e.message);
    return null;
  }
};

const from = () => process.env.SMTP_FROM || 'LeadsHer <noreply@localhost>';

/**
 * @param {{ to: string; subject: string; html: string; text?: string }} opts
 * @returns {Promise<{ sent: boolean }>}
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const transport = getTransporter();
  if (!transport) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[event-email stub]', { to, subject });
    }
    return { sent: false };
  }
  await transport.sendMail({
    from: from(),
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
  });
  return { sent: true };
};

module.exports = { sendEmail, getTransporter };
