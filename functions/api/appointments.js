
import { json } from '../_shared/admin-auth.js';
const toMinutes = value => { const m=String(value||'').match(/^(\d{1,2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):-1; };
export async function onRequestPost({request,env}) {
 if(!env.DB)return json({error:'Appointment requests are temporarily unavailable. Please contact us on WhatsApp.'},503);
 try {
  const b=await request.json();const name=String(b.name||'').trim().slice(0,120),phone=String(b.phone||'').trim().slice(0,40),date=String(b.date||''),time=String(b.time||''),services=Array.isArray(b.services)?b.services.map(x=>String(x).slice(0,100)).filter(Boolean).slice(0,20):[];
  if(!name||!phone||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!services.length)return json({error:'Please complete your name, phone, date and selected services.'},400);
  const [y,mo,d]=date.split('-').map(Number);const dateObj=new Date(Date.UTC(y,mo-1,d));if(dateObj.getUTCFullYear()!==y||dateObj.getUTCMonth()!==mo-1||dateObj.getUTCDate()!==d)return json({error:'Please choose a valid appointment date.'},400);const todayLagos=new Date(Date.now()+60*60*1000).toISOString().slice(0,10);if(date<todayLagos)return json({error:'Please choose today or a future date.'},400);const day=dateObj.getUTCDay();if(day===0)return json({error:'The studio is closed on Sundays.'},400);
  const mins=toMinutes(time);if(mins<600||mins>1020||mins%60!==0)return json({error:'Choose an appointment start time between 10:00 am and 5:00 pm.'},400);
  const massage=services.some(x=>/massage/i.test(x));const type=massage?'Home service':String(b.appointment_type||'');if(!['Home service','Walk-in / Studio'].includes(type))return json({error:'Choose walk-in/studio or home service.'},400);
  const address=String(b.address||'').trim().slice(0,500);if(type==='Home service'&&!address)return json({error:'A home service address is required.'},400);
  const hh=String(Math.floor(mins/60)).padStart(2,'0'),mm=String(mins%60).padStart(2,'0');const start=`${date} ${hh}:${mm}`,endMins=mins+120;if(endMins>1140)return json({error:'This two-hour appointment would extend beyond the 7:00 pm closing time. Please choose an earlier time.'},400);const end=`${date} ${String(Math.floor(endMins/60)).padStart(2,'0')}:${String(endMins%60).padStart(2,'0')}`;
  const conflict=await env.DB.prepare("SELECT id FROM appointments WHERE status='confirmed' AND start_at < ? AND end_at > ? LIMIT 1").bind(end,start).first();if(conflict)return json({error:'That two-hour time slot is already booked. Please choose another time.'},409);
  const id=crypto.randomUUID(),reference='CEE-AP-'+crypto.randomUUID().slice(0,8).toUpperCase();
  await env.DB.prepare('INSERT INTO appointments (id,reference,customer_name,customer_phone,services_json,appointment_type,service_address,appointment_date,start_time,start_at,end_at,notes,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,reference,name,phone,JSON.stringify(services),type,address,date,time,start,end,String(b.notes||'').slice(0,1000),'pending').run();
  return json({ok:true,reference,status:'pending',duration_minutes:120});
 } catch(e){return json({error:'Could not save your appointment request. Please try again or message us on WhatsApp.'},400);}
}
