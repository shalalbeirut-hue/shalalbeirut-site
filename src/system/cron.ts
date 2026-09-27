// Daily housekeeping: reminders for warranties about to end and routine tank cleaning.
import { type Env, notify, logActivity } from './lib';

export async function runDaily(env: Env) {
  const now = new Date();
  const in14 = new Date(now.getTime() + 14 * 86400_000).toISOString();

  // Warranties ending within 14 days, reminded once.
  const ending = await env.DB.prepare(
    `SELECT w.id, w.order_id, w.ends_at, o.code, c.name FROM warranties w
     JOIN orders o ON o.id = w.order_id JOIN customers c ON c.id = w.customer_id
     WHERE w.ends_at > ?1 AND w.ends_at <= ?2
       AND NOT EXISTS (SELECT 1 FROM activity_log a WHERE a.entity = 'warranty' AND a.entity_id = w.id AND a.action = 'ending_reminder')`,
  ).bind(now.toISOString(), in14).all<any>();
  for (const w of ending.results) {
    await notify(env, { role: 'cs' }, 'warranty.ending', `كفالة ${w.name} (طلب ${w.code}) تخلص قريب. اتصل عليه وشيّك إن كل شي تمام.`, w.order_id);
    await logActivity(env, null, 'warranty', w.id, 'ending_reminder');
  }

  // Tank cleaning is due every 6 months: remind once, 6 months after the last one.
  const sixMonthsAgo = new Date(now); sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 6);
  const tanks = await env.DB.prepare(
    `SELECT o.id, o.code, c.name FROM orders o JOIN customers c ON c.id = o.customer_id
     WHERE o.status IN ('done','closed') AND o.finished_at <= ?1
       AND EXISTS (SELECT 1 FROM order_services os JOIN services s ON s.id = os.service_id WHERE os.order_id = o.id AND s.slug = 'tanks-pumps')
       AND NOT EXISTS (SELECT 1 FROM orders o2 JOIN order_services os2 ON os2.order_id = o2.id JOIN services s2 ON s2.id = os2.service_id
                       WHERE o2.customer_id = o.customer_id AND s2.slug = 'tanks-pumps' AND o2.created_at > o.finished_at)
       AND NOT EXISTS (SELECT 1 FROM activity_log a WHERE a.entity = 'order' AND a.entity_id = o.id AND a.action = 'tank_reminder')`,
  ).bind(sixMonthsAgo.toISOString()).all<any>();
  for (const t of tanks.results) {
    await notify(env, { role: 'cs' }, 'tank.due', `موعد تنظيف خزان ${t.name} (آخر مرة طلب ${t.code}). كلّمه واعرض عليه موعد.`, t.id);
    await logActivity(env, null, 'order', t.id, 'tank_reminder');
  }

  // Old login attempts and expired sessions.
  const dayAgo = new Date(now.getTime() - 86400_000).toISOString();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM login_attempts WHERE at < ?1').bind(dayAgo),
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?1').bind(now.toISOString()),
  ]);
}
