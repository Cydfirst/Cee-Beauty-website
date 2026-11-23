
export async function onRequestGet({request,env}) {
  if(!env.PRODUCT_IMAGES) return new Response('Not found',{status:404});
  const key=new URL(request.url).searchParams.get('key'); if(!key || !/^products\/[a-zA-Z0-9-]+\.(jpg|png|webp)$/.test(key)) return new Response('Not found',{status:404});
  const obj=await env.PRODUCT_IMAGES.get(key); if(!obj) return new Response('Not found',{status:404});
  const headers=new Headers(); obj.writeHttpMetadata(headers); headers.set('etag',obj.httpEtag); headers.set('cache-control','public, max-age=31536000, immutable');
  return new Response(obj.body,{headers});
}
