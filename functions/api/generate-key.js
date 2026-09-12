// Cloudflare Pages Function — POST /api/generate-key
// Generates a new license key and stores it in Supabase
// Protected by ADMIN_PASSWORD env var
// Env vars needed: SUPABASE_URL, SUPABASE_SECRET, ADMIN_PASSWORD

function timingSafeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const adminPass = request.headers.get('X-Admin-Password') || '';
  if (!timingSafeEqual(adminPass, env.ADMIN_PASSWORD || '')) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_SECRET = env.SUPABASE_SECRET;

  if (!SUPABASE_URL || !SUPABASE_SECRET) {
    return Response.json({ error: 'Server misconfigured.' }, { status: 500 });
  }

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const key = `VL-${seg()}-${seg()}-${seg()}`;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/license_keys`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SECRET}`,
      'apikey': SUPABASE_SECRET,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({ key }),
  });

  if (!res.ok) {
    await res.json().catch(() => {});
    return Response.json({ error: 'Failed to store key.' }, { status: 500 });
  }

  return Response.json({ key });
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method not allowed', { status: 405 });
}
