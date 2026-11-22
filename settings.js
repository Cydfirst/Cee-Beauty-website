import { isAdmin, json } from '../../_shared/admin-auth.js';
const allowed = ['home_title','home_subtitle','home_image','bone_image','pixie_image','bone_base','pixie_base','bone_closures','pixie_closures'];
const pricingKeys = new Set(['bone_base','pixie_base','bone_closures','pixie_closures']);
export async function onRequest({request,env}) {
  if (!await isAdmin(request,env)) return json({error:'Please log in.'},401);
  if (!env.DB) return json({error:'D1 database binding DB is missing.'},503);
  if (request.method==='GET') {
    const r=await env.DB.prepare('SELECT setting_key,setting_value FROM site_settings').all();
    return json(Object.fromEntries((r.results||[]).map(x=>[x.setting_key,x.setting_value])));
  }
  if (request.method==='PUT') {
    const body=await request.json().catch(()=>null);
    if(!body||typeof body!=='object')return json({error:'Invalid settings payload.'},400);
    for(const k of allowed){
      if(typeof body[k]!=='string')continue;
      const value=body[k].slice(0,5000);
      if(pricingKeys.has(k)){
        try{const parsed=JSON.parse(value);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return json({error:'Hair price data must be a JSON object.'},400);}catch{return json({error:'Hair price data could not be saved. Please retry.'},400);}
      }
      await env.DB.prepare('INSERT INTO site_settings (setting_key,setting_value) VALUES (?,?) ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,updated_at=CURRENT_TIMESTAMP').bind(k,value).run();
    }
    return json({ok:true});
  }
  return json({error:'Method not allowed.'},405);
}
