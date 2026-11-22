import { isAdmin, json } from '../../_shared/admin-auth.js';
import { notifyOrderStatus } from '../../_shared/order-email.js';
const allowed=['order_received','processing_sourcing','packaged','dispatched','delivered','cancelled'];
export async function onRequest({request,env}){
 if(!await isAdmin(request,env))return json({error:'Please log in.'},401);
 if(!env.DB)return json({error:'D1 database binding DB is missing.'},503);
 if(request.method==='GET'){
  const r=await env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100').all();
  const ids=(r.results||[]).map(x=>x.id);let items=[];if(ids.length){const marks=ids.map(()=>'?').join(',');const q=await env.DB.prepare(`SELECT order_id,item_name,quantity,unit_amount_kobo FROM order_items WHERE order_id IN (${marks})`).bind(...ids).all();items=q.results||[];}
  return json({orders:(r.results||[]).map(o=>({...o,items:items.filter(i=>i.order_id===o.id)}))});
 }
 if(request.method==='PATCH'){
  const b=await request.json();if(!allowed.includes(b.status))return json({error:'Invalid order status.'},400);
  const r=await env.DB.prepare('UPDATE orders SET fulfilment_status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND payment_status=\'paid\'').bind(b.status,String(b.id)).run();
  if(Number(r.meta?.changes||0)!==1)return json({error:'Paid order not found.'},404);
  await notifyOrderStatus(env,String(b.id),b.status).catch(()=>{});return json({ok:true});
 }
 return json({error:'Method not allowed.'},405);
}
