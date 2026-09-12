// Cloudflare Pages Function — POST /api/claim-key
// Looks up a license key by buyer email (set by webhook on purchase)
// Env vars: SUPABASE_URL, SUPABASE_SECRET

export async function onRequestPost(context) {
  const { request, env } = context;
  const { SUPABASE_URL, SUPABASE_SECRET } = env;

  if (!SUPABASE_URL || !SUPABASE_SECRET) {
    return Response.json({ error: 'Server misconfigured.' }, { status: 500 });
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!email) return Response.json({ error: 'Email required.' }, { status: 400 });

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/license_keys?used_by_email=eq.${encodeURIComponent(email)}&select=key,used`,
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SECRET}`,
        'apikey': SUPABASE_SECRET,
      }
    }
  );

  const rows = await res.json();

  if (!Array.isArray(rows) || rows.length === 0) {
    return Response.json({ error: 'No key found for this email. Make sure you use the same email you purchased with.' }, { status: 404 });
  }

  const row = rows[0];
  return Response.json({ key: row.key, used: row.used });
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method not allowed', { status: 405 });
}
