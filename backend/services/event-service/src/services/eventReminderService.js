const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const { sendEmail } = require('../utils/email');
const { getEventStartDate, resolveReminderStartInstant } = require('../utils/eventStart');

const hoursBefore = () => Number(process.env.EVENT_REMINDER_HOURS_BEFORE) || 24;
/** Half-width of the “about N hours before start” window (hours). Cron should run at least twice within this span. */
const toleranceHours = () => Number(process.env.EVENT_REMINDER_TOLERANCE_HOURS) || 2;

function eventPageUrl(eventId) {
  const base = (process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/events/${eventId}`;
}

async function deliverRemindersForRegistrations(ev, regs, start) {
  let sent = 0;
  let skipped = 0;
  const h = hoursBefore();
  const startsAtIso = start.toISOString();
  const eventUrl = eventPageUrl(ev._id);

  for (const reg of regs) {
    const email = reg.user?.email;
    if (!email) {
      skipped += 1;
      continue;
    }

    const subject = `Reminder: "${ev.title}" starts in about ${h} hour${h === 1 ? '' : 's'}`;
    const html = buildReminderHtml({
      eventTitle: ev.title,
      userName: reg.user?.name,
      startsAtIso,
      eventUrl,
      hours: h,
    });
    const text = `Hi ${reg.user?.name || 'there'},\n\nReminder: you are registered for "${ev.title}". It starts in about ${h} hour(s).\nStarts (UTC): ${startsAtIso}\n\n${eventUrl}\n`;

    try {
      const { sent: ok } = await sendEmail({ to: email, subject, html, text });
      if (ok) {
        await EventRegistration.updateOne(
          { _id: reg._id },
          { $set: { reminderEmailSentAt: new Date() } }
        );
        sent += 1;
      } else {
        skipped += 1;
      }
    } catch (e) {
      console.error('[event-reminder] send failed', ev._id, email, e.message);
    }
  }

  return { sent, skipped };
}

function buildReminderHtml({ eventTitle, userName, startsAtIso, eventUrl, hours }) {
  const name = userName || 'there';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px 16px;background:#fdf2f8;font-family:system-ui,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #fbcfe8;padding:24px;border-radius:12px;">
    <p style="margin:0 0 8px 0;font-size:20px;font-weight:700;color:#9d174d;">LeadsHer</p>
    <p style="margin:0 0 16px 0;color:#374151;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px 0;color:#374151;">This is a reminder that you are registered for an event starting in about <strong>${hours} hour${hours === 1 ? '' : 's'}</strong>.</p>
    <p style="margin:0 0 8px 0;font-size:18px;font-weight:600;color:#111827;">${escapeHtml(eventTitle)}</p>
    <p style="margin:0 0 20px 0;font-size:14px;color:#6b7280;">Starts: ${escapeHtml(startsAtIso)} (UTC)</p>
    <p style="margin:0;text-align:center;">
      <a href="${eventUrl}" style="display:inline-block;padding:12px 28px;background:#db2777;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">View event</a>
    </p>
  </div>
</body></html>`;
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Send “starting in ~24h” emails to registered attendees. Safe to run repeatedly;
 * each registration is marked with reminderEmailSentAt after a successful send.
 */
async function runEventStartReminders() {
  const now = Date.now();
  const targetMsBeforeStart = hoursBefore() * 60 * 60 * 1000;
  const tolMs = (toleranceHours() * 60 * 60 * 1000) / 2;

  const events = await Event.find({ status: 'upcoming' }).lean();
  let sent = 0;
  let skipped = 0;

  for (const ev of events) {
    const start = getEventStartDate(ev);
    if (!start) continue;
    const startMs = start.getTime();
    if (startMs <= now) continue;

    const msUntilStart = startMs - now;
    if (Math.abs(msUntilStart - targetMsBeforeStart) > tolMs) continue;

    const regs = await EventRegistration.find({
      event: ev._id,
      status: 'registered',
      $or: [{ reminderEmailSentAt: null }, { reminderEmailSentAt: { $exists: false } }],
    }).populate('user', 'name email');

    const out = await deliverRemindersForRegistrations(ev, regs, start);
    sent += out.sent;
    skipped += out.skipped;
  }

  if (sent > 0 || (process.env.DEBUG_EVENT_REMINDERS === 'true' && events.length > 0)) {
    console.log(`[event-reminder] cycle done: sent=${sent} skippedNoSmtpOrEmail=${skipped}`);
  }
}

/**
 * Admin-triggered reminders for one event. Ignores the automated time window.
 * @param {object} eventLean — lean event doc with _id, title, date, startTime, status
 * @param {{ force?: boolean }} options — if force, resend to all registered (updates reminderEmailSentAt)
 */
async function sendManualReminderEmails(eventLean, { force = false } = {}) {
  const start = resolveReminderStartInstant(eventLean);
  if (!start) {
    return { sent: 0, skipped: 0, eligible: 0 };
  }

  const query = {
    event: eventLean._id,
    status: 'registered',
  };
  if (!force) {
    query.$or = [{ reminderEmailSentAt: null }, { reminderEmailSentAt: { $exists: false } }];
  }

  const regs = await EventRegistration.find(query).populate('user', 'name email');
  const { sent, skipped } = await deliverRemindersForRegistrations(eventLean, regs, start);
  return { sent, skipped, eligible: regs.length };
}

module.exports = { runEventStartReminders, sendManualReminderEmails };
