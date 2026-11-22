import { json } from '../_shared/admin-auth.js';
export async function onRequestGet({env}) {
 if(!env.DB) return json({});
 try { const r=await env.DB.prepare('SELECT setting_key,setting_value FROM site_settings').all(); return json(Object.fromEntries((r.results||[]).map(x=>[x.setting_key,x.setting_value]))); }
 catch { return json({}); }
}
