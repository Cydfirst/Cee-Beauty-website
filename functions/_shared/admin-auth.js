
const enc = new TextEncoder();
const b64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const unb64 = (value) => Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')), c => c.charCodeAt(0));
async function sign(value, secret) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
  return b64(await crypto.subtle.sign('HMAC', key, enc.encode(value)));
}
export async function createAdminCookie(secret) {
  const payload = b64(enc.encode(JSON.stringify({role:'admin',exp:Date.now()+8*60*60*1000})));
  return payload+'.'+await sign(payload,secret);
}
function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
export async function isAdmin(request, env) {
  if (!env.ADMIN_SESSION_SECRET) return false;
  const cookie = request.headers.get('Cookie') || '';
  const token = cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('cee_admin='))?.slice(10);
  if (!token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !constantTimeEqual(signature, await sign(payload,env.ADMIN_SESSION_SECRET))) return false;
  try { const data=JSON.parse(new TextDecoder().decode(unb64(payload))); return data.role==='admin' && data.exp>Date.now(); } catch { return false; }
}
export const json = (data,status=200,headers={}) => new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store',...headers}});

