
export async function onRequestPost(){
  return new Response(JSON.stringify({ok:true}),{
    headers:{
      'content-type':'application/json',
      'set-cookie':'cee_admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
    }
  });
}
