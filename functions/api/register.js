// Cloudflare Pages Function — POST /api/register
// Validates license key, creates Supabase user
// Env vars needed: SUPABASE_URL, SUPABASE_SECRET

// Rate limit: max 5 registration attempts per IP per 15 min
const ipAttempts = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const max = 5;
  const entry = ipAttempts.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    ipAttempts.set(ip, { count: 1, start: now });
    return false;
  }
  if (entry.count >= max) return true;
  entry.count++;
  ipAttempts.set(ip, entry);
  return false;
}

const KEY_REGEX = /^VL-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;

export async function onRequestPost(context) {
  const { request, env } = context;

  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_SECRET = env.SUPABASE_SECRET;

  if (!SUPABASE_URL || !SUPABASE_SECRET) {
    return Response.json({ error: 'Server misconfigured.' }, { status: 500 });
  }

  // Rate limit by IP
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited(ip)) {
    return Response.json({ error: 'Too many attempts. Please wait 15 minutes.' }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { email, password, licenseKey } = body;

  // Validate all fields
  if (!email || !password || !licenseKey) {
    return Response.json({ error: 'Missing required fields.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Invalid email address.' }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }
  // Reject anything that doesn't match VL-XXXX-XXXX-XXXX format — stops brute force garbage
  if (!KEY_REGEX.test(licenseKey.trim().toUpperCase())) {
    return Response.json({ error: 'Invalid license key format.' }, { status: 400 });
  }

  const normalizedKey = licenseKey.trim().toUpperCase();

  const headers = {
    'Authorization': `Bearer ${SUPABASE_SECRET}`,
    'apikey': SUPABASE_SECRET,
    'Content-Type': 'application/json',
  };

  // 1. Check license key exists and is unused
  const keyUrl = `${SUPABASE_URL}/rest/v1/license_keys?key=eq.${encodeURIComponent(normalizedKey)}&used=eq.false&select=id`;
  const keyRes = await fetch(keyUrl, { headers });
  const keys = await keyRes.json();

  if (!Array.isArray(keys) || keys.length === 0) {
    return Response.json({ error: 'Invalid or already used license key.' }, { status: 400 });
  }

  const keyId = keys[0].id;

  // 2. Create the user in Supabase Auth
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });

  const userData = await userRes.json();

  if (!userRes.ok || userData.error) {
    const msg = userData.msg || userData.error_description || userData.error || 'Could not create account.';
    if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')) {
      return Response.json({ error: 'An account with this email already exists.' }, { status: 400 });
    }
    return Response.json({ error: msg }, { status: 400 });
  }

  // 3. Mark the license key as used
  await fetch(`${SUPABASE_URL}/rest/v1/license_keys?id=eq.${keyId}`, {
    method: 'PATCH',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      used: true,
      used_by_email: email,
      used_at: new Date().toISOString(),
    }),
  });

  return Response.json({ success: true });
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method not allowed', { status: 405 });
}
