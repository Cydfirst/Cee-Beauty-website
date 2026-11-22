import { isAdmin, json } from '../../_shared/admin-auth.js';
export async function onRequestGet({request,env}) { const ok=await isAdmin(request,env); return json({authenticated:ok}); }
