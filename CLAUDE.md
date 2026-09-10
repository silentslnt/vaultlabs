# VaultLabs — Project Context for Claude

## What This Is
VaultLabs is an AI influencer course/toolkit product. The owner (Silent) runs an advanced AI character pipeline (krea2 + sakikrea LoRA) and is packaging that knowledge into sellable products. Site is live at vaultlabs.dev.

## Stack
- **Landing page**: Single `index.html` (vanilla HTML/CSS/JS, no frameworks, no build step)
- **Hosting**: Cloudflare Pages → connected to GitHub repo: https://github.com/silentslnt/vaultlabs.git
- **Domain**: vaultlabs.dev (registered on Cloudflare)
- **Payments + product delivery**: Whop — all 4 products are live
- **No backend. No React. No npm.** Static files only.

## Git Workflow
Files edited via OneDrive → owner commits + pushes from VS Code to `silentslnt/vaultlabs` → Cloudflare Pages auto-deploys.

## File Structure
```
vaultlabs/
├── index.html              ← Full landing page (all CSS/JS inline)
├── privacy.html            ← Privacy policy
├── terms.html              ← Terms of service (no refunds policy)
├── CLAUDE.md               ← This file
└── assets/
    ├── images/             ← Logo, favicon, product mockup
    │   ├── vaultlabslogo.png
    │   ├── vaultlabsfavicon.ico
    │   └── productmockup.png
    └── media/
        ├── exampleimages/      ← AI character images (hero carousel + workflow cards)
        ├── examplevideos/      ← AI video outputs (used in workflow cards)
        ├── proofandresultsimages/ ← Revenue/viral proof screenshots (testimonials + results)
        ├── workflowsetupexamples/ ← ComfyUI/RunPod screenshots (tutorial preview + workflow cards)
        ├── sitereferences/     ← Reference screenshots (not used in HTML)
        └── layout/             ← Duplicate of assets/images/ (ignore)
```

## 4 Whop Products (all live)
| Product | Price | Whop URL |
|---|---|---|
| Krea2 Image Kit | $49.99 | https://whop.com/vaultlabs/krea2-image-kit/ |
| Video Motion Control | $69 | https://whop.com/vaultlabs/video-motion-control/ |
| SCAIL-2 Video Motion Control | $99 | https://whop.com/vaultlabs/scail-2-video-motion-control/ |
| Full System | $179 | https://whop.com/vaultlabs/full-system-00/ |

All 4 links are already wired into index.html — nothing to replace.

## Design System
- **Background**: `#080808`
- **Accent**: `--blue: #3b82f6` / `--blue-light: #60a5fa`
- **Font**: Inter (Google Fonts CDN)
- **Cards**: `#111111` / `#161616`
- **Theme**: Dark only — do NOT switch to light/white

## What the Products Contain
- **Krea2 Image Kit** — txt2img, img2img, Ti2i, prompt builder, image edit, saki krea2 v2/v3/v3.1/v4 workflows + prompt library + setup guides
- **Video Motion Control** — MiniMax H3 motion workflow, krea2→H3 pipeline, LTX 2.3 director workflow
- **SCAIL-2 Video** — SCAIL-2 video-to-video + face detailer variant, 3 VRAM presets (8/12/16GB+)
- **Full System** — all of the above + Discord community access + lifetime updates

## Contact & Community
- Email: hello@vaultlabs.dev
- Discord: https://discord.gg/rkAmUvuMJZ

## What NOT to Do
- Don't add React/npm/build steps — static HTML only
- Don't change to white/light theme — dark is intentional
- Don't add a backend — Whop handles payments and delivery
- Don't use Gumroad
- Don't mention other creators or competitors in any copy
