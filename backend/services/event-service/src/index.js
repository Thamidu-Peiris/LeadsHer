const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const connectDB = require('./config/db');
const app = require('./app');
const { runEventStartReminders } = require('./services/eventReminderService');

const PORT = process.env.PORT || 5006;

const REMINDER_INTERVAL_MS = Math.max(
  5 * 60 * 1000,
  Number(process.env.EVENT_REMINDER_INTERVAL_MS) || 30 * 60 * 1000
);

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Event Service running on port ${PORT}`);
    });

    if (process.env.EVENT_REMINDER_ENABLED === 'false') {
      console.log('[event-reminder] disabled (EVENT_REMINDER_ENABLED=false)');
    } else {
      const tick = () => {
        runEventStartReminders().catch((e) => console.error('[event-reminder]', e.message || e));
      };
      setTimeout(tick, 20_000);
      setInterval(tick, REMINDER_INTERVAL_MS);
      console.log(
        `[event-reminder] scheduler every ${Math.round(REMINDER_INTERVAL_MS / 60000)} min (EVENT_REMINDER_INTERVAL_MS)`
      );
    }
  } catch (err) {
    console.error('[server] Failed to start:', err.message);
    process.exit(1);
  }
};

start();
