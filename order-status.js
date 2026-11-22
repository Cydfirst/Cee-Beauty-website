import { json } from '../_shared/admin-auth.js';
export async function onRequestGet({request,env}){
 if(!env.DB)return json({error:'Order tracking is temporarily unavailable.'},503);
 const u=new URL(request.url),number=(u.searchParams.get('order')||'').trim(),email=(u.searchParams.get('email')||'').trim().toLowerCase();
 if(!number||!email)return json({error:'Enter your order number and checkout email.'},400);
 const order=await env.DB.prepare("SELECT order_number,customer_name,customer_email,amount_kobo,payment_status,fulfilment_status,created_at FROM orders WHERE order_number=? AND lower(customer_email)=? AND payment_status='paid'").bind(number,email).first();
 if(!order)return json({error:'We could not find a paid order with those details. Check the order number and email.'},404);
 const items=await env.DB.prepare('SELECT item_name,quantity FROM order_items WHERE order_id=(SELECT id FROM orders WHERE order_number=?)').bind(number).all();
 return json({order:{number:order.order_number,name:order.customer_name,status:order.fulfilment_status,created_at:order.created_at,items:items.results||[]}});
}
