// Cloudflare Pages Function — POST /api/whop-webhook
// Triggered by Whop on membership.activated / payment.succeeded
// Generates a license key, stores in Supabase, emails buyer via Resend
// Env vars: SUPABASE_URL, SUPABASE_SECRET, RESEND_API_KEY, WHOP_WEBHOOK_SECRET

async function verifyWhopSignature(request, secret) {
  const signature = request.headers.get('x-whop-signature') || request.headers.get('whop-signature') || '';
  if (!signature) return { valid: false, body: null };

  const rawBody = await request.text();

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(rawBody);

  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const sigHex = Array.from(new Uint8Array(sigBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  // Whop may send "sha256=<hex>" or just "<hex>"
  const clean = signature.replace(/^sha256=/, '');
  const valid = clean === sigHex;

  return { valid, body: rawBody };
}

function generateKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `VL-${seg()}-${seg()}-${seg()}`;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const { SUPABASE_URL, SUPABASE_SECRET, RESEND_API_KEY, WHOP_WEBHOOK_SECRET } = env;

  if (!SUPABASE_URL || !SUPABASE_SECRET || !RESEND_API_KEY || !WHOP_WEBHOOK_SECRET) {
    return new Response('Server misconfigured', { status: 500 });
  }

  // Verify signature
  const { valid, body } = await verifyWhopSignature(request.clone(), WHOP_WEBHOOK_SECRET);
  if (!valid) {
    console.error('Whop webhook signature invalid');
    return new Response('Unauthorized', { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  const eventType = event.event || event.type || '';
  console.log('Whop webhook event:', eventType);

  // Only act on purchase/activation events
  if (!['membership.activated', 'payment.succeeded'].includes(eventType)) {
    // Return 200 so Whop doesn't retry — we just don't act on it
    return Response.json({ received: true, action: 'ignored' });
  }

  // Extract buyer email — Whop nests it differently per event type
  const email =
    event?.data?.user?.email ||
    event?.data?.membership?.user?.email ||
    event?.data?.email ||
    event?.user?.email ||
    null;

  if (!email) {
    console.error('No email found in Whop payload:', JSON.stringify(event).slice(0, 500));
    return Response.json({ received: true, action: 'no_email' });
  }

  const sbHeaders = {
    'Authorization': `Bearer ${SUPABASE_SECRET}`,
    'apikey': SUPABASE_SECRET,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  // Check if this email already has a key (prevent duplicate sends on duplicate events)
  const existingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/license_keys?used_by_email=eq.${encodeURIComponent(email)}&select=key`,
    { headers: sbHeaders }
  );
  const existing = await existingRes.json();
  if (Array.isArray(existing) && existing.length > 0) {
    console.log('Duplicate webhook for', email, '— key already exists, skipping');
    return Response.json({ received: true, action: 'duplicate_skipped' });
  }

  // Generate and store new key
  const key = generateKey();
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/license_keys`, {
    method: 'POST',
    headers: sbHeaders,
    body: JSON.stringify({
      key,
      used: false,
      // Store who it was issued for (not marked as used until they register)
      used_by_email: email,
      used_at: null,
    }),
  });

  if (!insertRes.ok) {
    const err = await insertRes.text();
    console.error('Supabase insert failed:', err);
    return new Response('Failed to store key', { status: 500 });
  }

  // Send email via Resend
  const registerUrl = 'https://vaultlabs.dev/webpanel/register.html';
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'VaultLabs <noreply@vaultlabs.dev>',
      to: [email],
      subject: 'Your VaultLabs License Key',
      html: `
        <div style="font-family:Inter,system-ui,sans-serif;background:#0c0c0c;color:#efefef;padding:40px;max-width:520px;margin:0 auto;border-radius:12px">
          <h1 style="font-size:24px;font-weight:800;letter-spacing:-.02em;margin:0 0 8px">
            Vault<span style="color:#3b82f6">Labs</span>
          </h1>
          <p style="color:rgba(255,255,255,.5);font-size:13px;margin:0 0 32px">Your purchase is confirmed.</p>

          <p style="font-size:15px;margin:0 0 20px">Here's your license key:</p>

          <div style="background:#1a1a1a;border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:16px 20px;text-align:center;margin-bottom:28px">
            <span style="font-family:monospace;font-size:20px;font-weight:700;letter-spacing:.08em;color:#60a5fa">${key}</span>
          </div>

          <p style="font-size:14px;color:rgba(255,255,255,.7);margin:0 0 20px">
            Use this key to create your account and unlock the full course:
          </p>

          <a href="${registerUrl}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px">
            Create Your Account →
          </a>

          <p style="font-size:12px;color:rgba(255,255,255,.3);margin:32px 0 0">
            This key is single-use and tied to your account. Don't share it.
          </p>
        </div>
      `,
    }),
  });

  if (!emailRes.ok) {
    const emailErr = await emailRes.text();
    console.error('Resend email failed:', emailErr);
    // Key is stored — email failed, but not catastrophic. Log it.
    return Response.json({ received: true, action: 'key_stored_email_failed', key });
  }

  console.log('Key issued and emailed to:', email);
  return Response.json({ received: true, action: 'key_issued' });
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method not allowed', { status: 405 });
}
