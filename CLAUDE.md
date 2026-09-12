# VaultLabs — Claude Context

## Site
- Static HTML/CSS/JS deployed on Cloudflare Pages
- Custom domain: https://vaultlabs.dev
- GitHub: https://github.com/silentslnt/vaultlabs.git
- Auto-deploys on push to `main`
- Push from Windows terminal — sandbox can't authenticate GitHub

## File Structure
```
vaultlabs/
  index.html          — homepage
  toolkit.html        — full course (17 modules, auth-gated preview)
  privacy.html
  terms.html
  assets/
  webpanel/
    login.html        — Supabase email+password login
    register.html     — license key + create account
    claim.html        — buyer enters email → key sent to inbox
    forgot.html       — password reset request
    reset-confirm.html — set new password (handles Supabase reset token)
  functions/api/
    register.js       — validates license key, creates Supabase user
    generate-key.js   — admin-only key generation (X-Admin-Password header)
    claim-key.js      — sends key to buyer's email via Resend (rate limited)
    whop-webhook.js   — Whop purchase webhook → generate key → email buyer
```

## Products (Whop)
| Product | Price | Link |
|---|---|---|
| Krea2 Image Kit | $49 | https://whop.com/vaultlabs/krea2-image-kit/ |
| Motion Control | $69 | https://whop.com/vaultlabs/video-motion-control/ |
| SCAIL-2 Video | $99 | https://whop.com/vaultlabs/scail-2-video-motion-control/ |
| Full System | $179 | https://whop.com/vaultlabs/full-system-00/ |

Discord: https://discord.gg/rkAmUvuMJZ
RunPod referral: https://runpod.io?ref=2n2itn2n
Monetization platform: **Stacked** (not Fanvue — all references updated)

## Auth System (LIVE)
- **Supabase** project: `qmoudajzycshbssdlczg.supabase.co`
- **Publishable key** (safe in frontend): `sb_publishable_TACZIaiyoxdTGv4QVoKPRg_Sax_NNAc`
- **Secret key**: Cloudflare env var only — NEVER in any file
- **License key format**: `VL-XXXX-XXXX-XXXX` (no 0/O/1/I)
- **RLS**: enabled on `license_keys` table — no client-side access
- **Supabase Site URL**: https://vaultlabs.dev (set in Auth → URL Configuration)
- **Redirect URLs**: https://vaultlabs.dev/* (set in Auth → URL Configuration)

### Purchase → Access Flow
1. Buyer purchases on Whop
2. Whop fires webhook → `POST /api/whop-webhook`
3. Function generates `VL-XXXX-XXXX-XXXX` key, stores in Supabase with buyer email
4. Resend emails key to buyer from `noreply@vaultlabs.dev`
5. Buyer goes to `vaultlabs.dev/webpanel/claim.html` → enters email → gets key emailed
6. Buyer goes to `register.html` (key pre-filled via ?key= param) → creates account
7. Logged-in users see "MEMBER" badge, preview banner hidden

### Whop Config
- Webhook URL: `https://vaultlabs.dev/api/whop-webhook`
- Events: `membership.activated`, `payment.succeeded`, `membership.deactivated`
- Checkout success redirect: `https://vaultlabs.dev/webpanel/claim.html`

### Cloudflare Env Vars (all Secret type)
- `SUPABASE_URL` — https://qmoudajzycshbssdlczg.supabase.co
- `SUPABASE_SECRET` — Supabase secret key
- `ADMIN_PASSWORD` — for /api/generate-key endpoint
- `RESEND_API_KEY` — re_... key from Resend
- `WHOP_WEBHOOK_SECRET` — ws_... from Whop webhook settings

### Resend
- Domain: vaultlabs.dev (verified)
- From: noreply@vaultlabs.dev
- API key: "vaultlabs" key with Sending access

## Security Implemented
- Timing-safe comparison on webhook signature and admin password
- Key never exposed in browser — claim page sends email only
- Email enumeration protection — claim always shows "check inbox"
- No PII in server logs — emails never logged, raw payloads never logged
- Rate limiting: register (5/15min), claim (3/15min) per IP
- Key format regex validation before any DB lookup
- Email format validation on all endpoints
- Internal error details never sent to client
- RLS blocks all client-side DB access

## toolkit.html
- Full dark theme: `--bg:#0c0c0c`, `--surface:#131313`, `--surface-2:#1a1a1a`, `--border:rgba(255,255,255,.07)`, `--blue:#3b82f6`
- 17 modules (00–16): Intro → Hardware → RunPod Setup → Install ComfyUI → ComfyUI Manager → Navigating ComfyUI → Models → Character Gen → Dataset → LoRA Training → Production Images → Skin Enhance → Prompting → MiniMax Video → SCAIL Video → Content Strategy → Monetization
- Preview mode: non-logged-in users see full module structure + preview banner, no hard redirect
- Auth gate at top: checks Supabase session, shows member badge or preview banner
- RunPod referral added in Module 01 (step 3) and Module 02 (step 1)
- All Fanvue references replaced with Stacked throughout
- "Explore Toolkit" button added to index.html hero

## index.html
- Dark theme: bg #0c0c0c
- Hero CTAs: "Get instant access · from $49" + "Explore Toolkit" (links to toolkit.html)

## Current Theme (Dark)
- bg: #0c0c0c, surface: #131313, surface-2: #1a1a1a
- border: rgba(255,255,255,.07)
- blue: #3b82f6, blue-light: #5b9ef9
- Inter font, SVG icons only (no emoji), 8px spacing scale

## RunPod Setup Script
`Saki/RUNPOD-NEW-POD-SETUP.sh`
- Referral comment at top with runpod.io?ref=2n2itn2n
- Uses `python3` not `python`
- ComfyUI path: `/workspace/runpod-slim/ComfyUI/`
- Network volume models: `/workspace/ComfyUI/models/`

## Security / Never Do
- Never save CivitAI tokens to any file
- Never reference images 76, 77, 79, 155
- Never clear ComfyUI queue mid-run
- Approved outputs → `approvedgens2/` only
- Never save SUPABASE_SECRET, RESEND_API_KEY, WHOP_WEBHOOK_SECRET, ADMIN_PASSWORD to any file

## LoRA / Model Links
- bloomgirls-ultrarealism-krea2: https://civitai.com/models/2735553
- RealisticSnapshot: https://civitai.com/models/2268008/realistic-snapshot-z-image-turbo-krea-2
- krea2filterbypass [Fedor]: https://civitai.com/models/2746817/krea2-filter-bypass-fedor
- TextFusion: https://civitai.com/models/2775340/krea2-textfusion-refusal-reduction-lora
- krea2 turbo LoRA rank64: https://huggingface.co/Comfy-Org/Krea-2/resolve/main/loras/krea2_turbo_lora_rank_64_bf16.safetensors
- krea2 depth controlnet: https://huggingface.co/Patil/Krea-2-depth-controlnet/resolve/main/krea2_depth_controlnet.safetensors
- LTX FaceID: https://huggingface.co/Alissonerdx/LTX-Best-Face-ID/resolve/main/Best_FaceID_v1.0_LoRA.safetensors

## Pending / TODO
- User to add demo videos to toolkit.html video placeholder slots
- Add Cloudflare rate limiting rule: Security → Rate limiting rules → /api/ path → 10 req/10s → Block
- Test full purchase flow end to end (Whop test purchase → webhook → email → claim → register)
