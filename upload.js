import { isAdmin, json } from '../../_shared/admin-auth.js';
export async function onRequestPost({request,env}) {
  if(!await isAdmin(request,env)) return json({error:'Please log in.'},401);
  if(!env.PRODUCT_IMAGES) return json({error:'R2 bucket binding PRODUCT_IMAGES is not connected yet.'},503);
  const form=await request.formData(); const file=form.get('image');
  if(!file || typeof file.arrayBuffer!=='function') return json({error:'Choose an image to upload.'},400);
  if(file.size>8*1024*1024) return json({error:'Image must be 8MB or smaller.'},400);
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)) return json({error:'Use JPG, PNG or WebP images.'},400);
  const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg'; const key=`products/${crypto.randomUUID()}.${ext}`;
  await env.PRODUCT_IMAGES.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type,cacheControl:'public, max-age=31536000, immutable'}});
  return json({ok:true,key,url:'/api/media?key='+encodeURIComponent(key)});
}
