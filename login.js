import { createAdminCookie, json } from '../../_shared/admin-auth.js';

const windowMs = 15 * 60 * 1000;
const lockMs = 15 * 60 * 1000;
const maxFailures = 5;
const equalPassword = (a, b) => {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
};
async function ipKey(ip, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip || 'unknown'));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, '0')).join('');
}
export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) return json({ error: 'Admin login is not configured. Add ADMIN_PASSWORD and ADMIN_SESSION_SECRET in Cloudflare.' }, 503);
  if (!env.DB) return json({ error: 'Admin login is unavailable until the database is connected.' }, 503);
  const body = await request.json().catch(() => ({}));
  const password = String(body.password || '');
  const key = await ipKey(request.headers.get('CF-Connecting-IP') || 'unknown', env.ADMIN_SESSION_SECRET);
  const now = Date.now();
  const current = await env.DB.prepare('SELECT failed_count,window_start,locked_until FROM admin_login_limits WHERE ip_hash=?').bind(key).first();
  if (current?.locked_until && Number(current.locked_until) > now) return json({ error: 'Too many attempts. Please wait 15 minutes before trying again.' }, 429);
  const recent = current && Number(current.window_start) + windowMs > now;
  const failures = recent ? Number(current.failed_count) : 0;
  if (!equalPassword(password, String(env.ADMIN_PASSWORD))) {
    const count = failures + 1;
    const lockedUntil = count >= maxFailures ? now + lockMs : 0;
    await env.DB.prepare('INSERT INTO admin_login_limits (ip_hash,failed_count,window_start,locked_until) VALUES (?,?,?,?) ON CONFLICT(ip_hash) DO UPDATE SET failed_count=excluded.failed_count,window_start=excluded.window_start,locked_until=excluded.locked_until')
      .bind(key, count, recent ? Number(current.window_start) : now, lockedUntil).run();
    return json({ error: lockedUntil ? 'Too many attempts. Please wait 15 minutes before trying again.' : 'Incorrect password.' }, lockedUntil ? 429 : 401);
  }
  await env.DB.prepare('DELETE FROM admin_login_limits WHERE ip_hash=?').bind(key).run();
  const token = await createAdminCookie(env.ADMIN_SESSION_SECRET);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'set-cookie': `cee_admin=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800` } });
}
