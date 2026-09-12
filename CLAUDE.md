# VaultLabs — Claude Context

## Site
- Static HTML/CSS/JS (single file: `index.html`)
- GitHub: https://github.com/silentslnt/vaultlabs.git
- Deployed: Cloudflare Pages (auto-deploys on push to `main`)
- Push from Windows terminal — sandbox can't authenticate GitHub

## Products (Whop)
| Product | Price | Link |
|---|---|---|
| Krea2 Image Kit | $49 | https://whop.com/vaultlabs/krea2-image-kit/ |
| Motion Control | $69 | https://whop.com/vaultlabs/video-motion-control/ |
| SCAIL-2 Video | $99 | https://whop.com/vaultlabs/scail-2-video-motion-control/ |
| Full System | $179 | https://whop.com/vaultlabs/full-system-00/ |

Discord: https://discord.gg/rkAmUvuMJZ
RunPod referral: https://runpod.io?ref=2n2itn2n

## Current Theme
WHITE — background:#fff, body color:#0a0a0a
- Card bg: #f4f4f4, card-2: #eaeaea
- Border: rgba(0,0,0,.09)
- Bundle/featured pricing cards stay dark (blue-black gradient)
- Sticky bar stays dark for contrast
- Nav: white with blur

## Carousel
- CSS class positions: `card-far-left`, `card-left`, `card-center`, `card-right`, `card-far-right`
- All cards fixed size: 280×400px base
- Size done via `transform: scale()` — NOT width/height (avoids blur glitch)
  - center: scale(1), left/right: scale(0.786), far: scale(0.607)
- Transition: `transform .7s cubic-bezier(.4,0,.2,1), opacity .7s ease` — NO width/height in transition
- JS cycles through all N cards, assigns slot 0-4 → CSS class, rest hidden (opacity:0)
- Auto-rotates every 2800ms

## Drag Gallery
- CSS: `.drag-gallery` has `overflow-x:scroll` (scrollbar hidden via `::-webkit-scrollbar{display:none}`)
- JS: uses native `gallery.scrollLeft` — NOT translateX on track
- Touch support included

## Before/After Slider
- `.ba-wrap[data-ba]` containers with `.ba-before`, `.ba-after`, `.ba-handle`
- JS clips `ba-before` via `width` percentage from mouse drag

## Sections (order in file)
1. Nav
2. Hero (carousel, CTA)
3. Tagline strip
4. Stats strip (13 modules / 7+ workflows / $0 monthly / ∞ updates)
5. Testimonials (just proof screenshot images — no fake avatars)
6. "Who this is for" (3 cards)
7. Workflows (4 cards + drag gallery + before/after sliders + checklist)
8. Tutorials (preview image + module grid 00-12)
9. GPU checker (RunPod referral CTA inside)
10. Results grid
11. Pricing (3 solo cards + 1 bundle)
12. Trust badges
13. FAQ
14. Sticky buy bar (IntersectionObserver on `.hero`)
15. Footer

## Proof/Results Images
Location: `assets/media/proofandresultsimages/`
- `12k$inearningtopayout.webp`
- `1k+earningin a week.webp`
- `30k+$earned.webp`
- `30k+earned and trend analyics.webp`
- `5m+ views.webp`
- `Screenshot 2026-08-06 141059.png`
- `aimodelgettingcommentsandviewsoninsta.png`
- `payoutnotificationsscreenshotmasspay.webp`
- `perosnindiscordwhoearned.png`
- `personindiscordwhoeanred.png`

## RunPod Setup Script
`Saki/RUNPOD-NEW-POD-SETUP.sh`
- Referral comment at top with runpod.io?ref=2n2itn2n
- Uses `python3` not `python` (python not found on RunPod)
- ComfyUI path: `/workspace/runpod-slim/ComfyUI/`
- Network volume models: `/workspace/ComfyUI/models/`

## toolkit.html
- Full dark theme (#0c0c0c bg, #131313 surface, rgba(255,255,255,.07) border)
- 17 modules (00–16): Intro → Hardware → RunPod Setup → Install ComfyUI → ComfyUI Manager → Navigating ComfyUI → Models → Character Gen → Dataset → LoRA Training → Production Images → Skin Enhance → Prompting → MiniMax Video → SCAIL Video → Content Strategy → Monetization
- Each module has: description, what's covered (bullet points), step-by-step walkthrough with code blocks + tip/warn/video-placeholder blocks, chapter list, downloads linked to Whop
- Step blocks use visual step numbers, code blocks in monospace green, tip boxes in green, warn boxes in amber, video placeholders (dashed border) for user to add their demo videos
- Category color tags: Setup=blue, Training=purple, Image=green, Video=amber, Strategy=pink, Prompts=teal
- Sidebar: 17 module buttons + 4 product download links at bottom
- Products bar at bottom: 4 Whop purchase pills
- Video placeholders marked "add video here" — user will record and insert these themselves

## Pending / TODO
- User to add demo videos to toolkit.html video placeholder slots
- Push to GitHub from Windows terminal: cd to vaultlabs folder → git add . → git commit -m "message" → git push origin main
- Upload workflow .json files to Whop Files section (user does this)
- Access control system for toolkit.html (see notes below)

## Access Control Options for toolkit.html
Since toolkit is public HTML, options for locking to paying customers:
1. **Whop embed** — host toolkit inside Whop's platform (they handle auth). Simplest, no code.
2. **Password page** — add a JS password gate on toolkit.html. Give buyers the password in Whop welcome DM. Easy but not secure (shareable).
3. **One-time key system** — generate unique redemption codes in Whop, buyer enters code once, JS stores unlock state in localStorage. Moderate security.
4. **Auth0 / Clerk** — proper login system (email+password), integrate with Whop webhook to create accounts on purchase. Most secure, requires backend.
Recommended: Start with Whop's built-in community hub or a simple password gate. Upgrade to key system when you have volume.

## Security / Never Do
- Never save CivitAI tokens to any file
- Never reference images 76, 77, 79, 155
- Never clear ComfyUI queue mid-run
- Approved outputs → `approvedgens2/` only

## LoRA / Model Links
- bloomgirls-ultrarealism-krea2: https://civitai.com/models/2735553
- RealisticSnapshot: https://civitai.com/models/2268008/realistic-snapshot-z-image-turbo-krea-2
- krea2filterbypass [Fedor]: https://civitai.com/models/2746817/krea2-filter-bypass-fedor
- TextFusion: https://civitai.com/models/2775340/krea2-textfusion-refusal-reduction-lora
- krea2 turbo LoRA rank64: https://huggingface.co/Comfy-Org/Krea-2/resolve/main/loras/krea2_turbo_lora_rank_64_bf16.safetensors
- krea2 depth controlnet: https://huggingface.co/Patil/Krea-2-depth-controlnet/resolve/main/krea2_depth_controlnet.safetensors
- LTX FaceID: https://huggingface.co/Alissonerdx/LTX-Best-Face-ID/resolve/main/Best_FaceID_v1.0_LoRA.safetensors
