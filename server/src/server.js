import 'dotenv/config';
import { createApp } from './app.js';
import pool from './db/pool.js';

try {
  const app = createApp();
  // Fail before accepting traffic if the required migrations are missing.
  const tables = ['users', 'user_sessions', 'tours', 'tour_departures', 'bookings', 'admin_audit_logs', 'booking_payment_events'];
  for (const table of tables) {
    const result = await pool.query('SELECT to_regclass($1) AS name', ['public.' + table]);
    if (!result.rows[0].name) throw new Error('Missing required database migration: ' + table);
  }
  const port = Number(process.env.PORT) || 5000;
  const server = app.listen(port, '0.0.0.0', () => console.log(`Travel Mint listening on port ${port}`));
  let stopping = false;
  const shutdown = () => {
    if (stopping) return; stopping = true;
    const timeout = setTimeout(() => process.exit(1), 10000); timeout.unref();
    server.close(async () => {
      await app.locals.sessionStore.close(); await pool.end(); clearTimeout(timeout); process.exit(0);
    });
    server.closeIdleConnections();
  };
  process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
} catch (error) {
  console.error('Startup failed:', error.code || error.message); await pool.end(); process.exit(1);
}
