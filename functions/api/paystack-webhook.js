const toHex = bytes => [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
const same = (a, b) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  return toHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)));
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return new Response('Not configured', { status: 503 });

  const raw = await request.text();
  const currentHeader = request.headers.get('paystack-signature') || '';
  let valid = false;

  if (currentHeader && env.PAYSTACK_WEBHOOK_SECRET) {
    let timestamp = null;
    const signatures = [];

    for (const part of currentHeader.split(',')) {
      const i = part.indexOf('=');
      if (i < 0) continue;
      const k = part.slice(0, i).trim();
      const v = part.slice(i + 1).trim();
      if (k === 't' && /^\d+$/.test(v)) timestamp = Number(v);
      if (k === 'v1') {
        const j = v.indexOf(':');
        if (j > -1) signatures.push(v.slice(j + 1));
      }
    }

    const now = Math.floor(Date.now() / 1000);
    if (timestamp !== null && Math.abs(now - timestamp) <= 300 && signatures.length) {
      const expected = await hmac(env.PAYSTACK_WEBHOOK_SECRET, timestamp + '.' + raw);
      valid = signatures.some(s => /^[0-9a-f]{128}$/.test(s) && same(expected, s));
    }
  }

  if (!valid && env.PAYSTACK_SECRET_KEY) {
    const legacy = request.headers.get('x-paystack-signature') || '';
    if (/^[0-9a-f]{128}$/.test(legacy)) {
      valid = same(await hmac(env.PAYSTACK_SECRET_KEY, raw), legacy);
    }
  }

  if (!valid) return new Response('Invalid signature', { status: 401 });

  const event = JSON.parse(raw);
  if (event.event === 'ping') return new Response('OK');

  if (event.event === 'charge.success') {
    const d = event.data;
    const order = await env.DB.prepare(
      'SELECT id,amount_kobo FROM orders WHERE payment_reference=?'
    ).bind(d.reference).first();

    if (
      order &&
      Number(d.amount) === Number(order.amount_kobo) &&
      d.currency === 'NGN' &&
      d.status === 'success'
    ) {
      await env.DB.prepare(
        "UPDATE orders SET payment_status='paid',fulfilment_status='payment_confirmed',updated_at=CURRENT_TIMESTAMP WHERE id=?"
      ).bind(order.id).run();
    }
  }

  return new Response('OK');
}
