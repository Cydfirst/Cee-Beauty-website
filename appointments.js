import { isAdmin, json } from '../../_shared/admin-auth.js';
const allowed=['pending','confirmed','declined','cancelled'];
export async function onRequest({request,env}){
 if(!await isAdmin(request,env))return json({error:'Please log in.'},401);
 if(!env.DB)return json({error:'D1 database binding DB is missing.'},503);
 if(request.method==='GET'){const r=await env.DB.prepare('SELECT * FROM appointments ORDER BY appointment_date DESC,start_time DESC LIMIT 100').all();return json({appointments:(r.results||[]).map(x=>({...x,services:JSON.parse(x.services_json||'[]')}))});}
 if(request.method==='PATCH'){
  const b=await request.json();if(!allowed.includes(b.status))return json({error:'Invalid appointment status.'},400);
  if(b.status==='confirmed'){
   const q=await env.DB.prepare("UPDATE appointments SET status='confirmed',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status IN ('pending','confirmed') AND NOT EXISTS (SELECT 1 FROM appointments other WHERE other.status='confirmed' AND other.id<>appointments.id AND other.start_at < appointments.end_at AND other.end_at > appointments.start_at)").bind(String(b.id)).run();
   if(Number(q.meta?.changes||0)!==1)return json({error:'This time overlaps with another confirmed appointment. It has not been confirmed.'},409);
  } else {await env.DB.prepare('UPDATE appointments SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(b.status,String(b.id)).run();}
  return json({ok:true});
 }
 return json({error:'Method not allowed.'},405);
}
