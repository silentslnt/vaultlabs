// Cloudflare Pages Function — POST /api/generate-key
// Generates a new license key and stores it in Supabase
// Protected by ADMIN_PASSWORD env var
// Env vars needed: SUPABASE_URL, SUPABASE_SECRET, ADMIN_PASSWORD

export async function onRequestPost(context) {
  const { request, env } = context;

  // Check admin password header
  const adminPass = request.headers.get('X-Admin-Password');
  if (!adminPass || adminPass !== env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_SECRET = env.SUPABASE_SECRET;

  // Generate key in format: VL-XXXX-XXXX-XXXX
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I confusion
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
    const err = await res.json();
    return Response.json({ error: 'Failed to store key.', detail: err }, { status: 500 });
  }

  return Response.json({ key });
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method not allowed', { status: 405 });
}
