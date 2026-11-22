const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function send(env,to,subject,html){
 if(!env.RESEND_API_KEY||!env.EMAIL_FROM||!to)return false;
 const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:env.EMAIL_FROM,to:[to],subject,html})});
 return r.ok;
}
export async function notifyPaidOrder(env,orderId){
 if(!env.DB||!env.RESEND_API_KEY||!env.EMAIL_FROM)return;
 const order=await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(orderId).first();if(!order||order.payment_status!=='paid')return;
 const items=await env.DB.prepare('SELECT item_name,quantity,unit_amount_kobo,item_data FROM order_items WHERE order_id=?').bind(orderId).all();
 const rows=(items.results||[]).map(x=>{let meta={};try{meta=JSON.parse(x.item_data||'{}')}catch{}const delivery=meta.delivery_group==='hair'?'Estimated delivery: 1–3 days':'Estimated delivery: 1–2 days';return `<li>${esc(x.item_name)} × ${x.quantity} — ₦${(x.unit_amount_kobo/100).toLocaleString('en-NG')}<br><small>${delivery}</small></li>`}).join('');
 const body=`<h2>Order ${esc(order.order_number)} received</h2><p>Customer: ${esc(order.customer_name)}<br>Phone: ${esc(order.customer_phone)}<br>Email: ${esc(order.customer_email)}<br>Delivery address: ${esc(order.delivery_address)}</p><ul>${rows}</ul><p><strong>Total paid: ₦${(order.amount_kobo/100).toLocaleString('en-NG')}</strong></p><p>Delivery fee is confirmed separately before dispatch.</p><p>Payment reference: ${esc(order.payment_reference)}</p>`;
 const owner=env.OWNER_NOTIFICATION_EMAIL;
 const events=[['customer_paid',order.customer_email,`Cee Beauty order ${order.order_number} confirmed`,body],['owner_paid',owner,`New paid Cee Beauty order ${order.order_number}`,body]];
 for(const [event,to,subject,html] of events){if(!to)continue;const claim=await env.DB.prepare('INSERT OR IGNORE INTO order_notifications (order_id,event_key) VALUES (?,?)').bind(orderId,event).run();if(Number(claim.meta?.changes||0)===1){const ok=await send(env,to,subject,html);if(!ok)await env.DB.prepare('DELETE FROM order_notifications WHERE order_id=? AND event_key=?').bind(orderId,event).run();}}
}
export async function notifyOrderStatus(env,orderId,status){
 if(!env.DB||!env.RESEND_API_KEY||!env.EMAIL_FROM)return;
 const order=await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(orderId).first();if(!order)return;
 const labels={order_received:'Order received',processing_sourcing:'Processing / sourcing',packaged:'Packaged',dispatched:'Dispatched',delivered:'Delivered',cancelled:'Cancelled'};
 const label=labels[status]||status;const html=`<h2>Your Cee Beauty order is ${esc(label.toLowerCase())}</h2><p>Hello ${esc(order.customer_name)},</p><p>Your order <strong>${esc(order.order_number)}</strong> is now: <strong>${esc(label)}</strong>.</p><p>Thank you for shopping with The Cee Beauty Shop.</p>`;
 const event='status_'+status;const recipients=[['customer',order.customer_email],['owner',env.OWNER_NOTIFICATION_EMAIL]];
 for(const [who,to] of recipients){if(!to)continue;const claim=await env.DB.prepare('INSERT OR IGNORE INTO order_notifications (order_id,event_key) VALUES (?,?)').bind(orderId,event+'_'+who).run();if(Number(claim.meta?.changes||0)===1){const ok=await send(env,to,`Cee Beauty order ${order.order_number}: ${label}`,html);if(!ok)await env.DB.prepare('DELETE FROM order_notifications WHERE order_id=? AND event_key=?').bind(orderId,event+'_'+who).run();}}
}
