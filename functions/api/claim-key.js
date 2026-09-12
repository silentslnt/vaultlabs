// Cloudflare Pages Function — POST /api/claim-key
// Sends license key to buyer's email via Resend — never exposes key directly in response
// Env vars: SUPABASE_URL, SUPABASE_SECRET, RESEND_API_KEY

// Simple in-memory rate limit: max 3 requests per IP per 15 min window
const ipAttempts = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const max = 3;
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

export async function onRequestPost(context) {
  const { request, env } = context;
  const { SUPABASE_URL, SUPABASE_SECRET, RESEND_API_KEY } = env;

  if (!SUPABASE_URL || !SUPABASE_SECRET || !RESEND_API_KEY) {
    return Response.json({ error: 'Server misconfigured.' }, { status: 500 });
  }

  // Rate limit by IP
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited(ip)) {
    return Response.json({ error: 'Too many requests. Please wait 15 minutes and try again.' }, { status: 429 });
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Valid email required.' }, { status: 400 });
  }

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

  // Always return same message whether found or not (prevents email enumeration)
  const genericMsg = { sent: true };

  if (!Array.isArray(rows) || rows.length === 0) {
    // Return same success response — don't reveal if email exists or not
    return Response.json(genericMsg);
  }

  const { key, used } = rows[0];
  const registerUrl = used
    ? 'https://vaultlabs.dev/webpanel/login.html'
    : `https://vaultlabs.dev/webpanel/register.html?key=${encodeURIComponent(key)}`;

  const subject = used
    ? 'Your VaultLabs key was already used'
    : 'Your VaultLabs License Key';

  const bodyHtml = used
    ? `
      <div style="font-family:Inter,system-ui,sans-serif;background:#0c0c0c;color:#efefef;padding:40px;max-width:520px;margin:0 auto;border-radius:12px">
        <h1 style="font-size:24px;font-weight:800;letter-spacing:-.02em;margin:0 0 8px">Vault<span style="color:#3b82f6">Labs</span></h1>
        <p style="color:rgba(255,255,255,.5);font-size:13px;margin:0 0 24px">Access recovery</p>
        <p style="font-size:15px;margin:0 0 20px;color:rgba(255,255,255,.8)">Your license key has already been used to create an account. Log in with the email and password you set during registration.</p>
        <a href="${registerUrl}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px">Log in →</a>
        <p style="font-size:12px;color:rgba(255,255,255,.3);margin:24px 0 0">If you didn't register yet, contact support.</p>
      </div>`
    : `
      <div style="font-family:Inter,system-ui,sans-serif;background:#0c0c0c;color:#efefef;padding:40px;max-width:520px;margin:0 auto;border-radius:12px">
        <h1 style="font-size:24px;font-weight:800;letter-spacing:-.02em;margin:0 0 8px">Vault<span style="color:#3b82f6">Labs</span></h1>
        <p style="color:rgba(255,255,255,.5);font-size:13px;margin:0 0 32px">Your purchase is confirmed.</p>
        <p style="font-size:15px;margin:0 0 20px">Here's your license key:</p>
        <div style="background:#1a1a1a;border:1px solid rgba(59,130,246,.2);border-radius:8px;padding:16px 20px;text-align:center;margin-bottom:28px">
          <span style="font-family:monospace;font-size:20px;font-weight:700;letter-spacing:.08em;color:#60a5fa">${key}</span>
        </div>
        <p style="font-size:14px;color:rgba(255,255,255,.7);margin:0 0 20px">Click below to create your account — the key will be pre-filled:</p>
        <a href="${registerUrl}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px">Create your account →</a>
        <p style="font-size:12px;color:rgba(255,255,255,.3);margin:32px 0 0">This key is single-use. Don't share it.</p>
      </div>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'VaultLabs <noreply@vaultlabs.dev>',
      to: [email],
      subject,
      html: bodyHtml,
    }),
  });

  // Always return same response — don't leak whether email was found
  return Response.json(genericMsg);
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method not allowed', { status: 405 });
}
