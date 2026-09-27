# leledan-ws

A professional portfolio website for **leledan06**, a professional Minecraft builder specializing in organic creations, advanced terraforming, and epic structures. Built with Nuxt 3 and modern web technologies.

## 🎯 Overview

This is a responsive portfolio website showcasing Minecraft building services, featuring an elegant design with smooth animations, interactive galleries, and comprehensive service information.

## ✨ Features

### 🏠 Home Page
- **Animated Hero Section**: Dynamic background with crossfade transitions and breathing animations
- **About Section**: Personal introduction highlighting expertise in organic builds, terraforming, and architectural structures
- **Skills Showcase**: Interactive display of technical competencies including:
  - Organic sculptures (animals, humans, creatures)
  - Botany and flora design
  - Terrain sculpting and terraforming
  - Architecture (various styles)
  - Lighting expertise
  - Video editing
  - Skin creation
- **Customer Marquee**: Scrolling showcase of clients and collaborators (YouTubers and servers)

### 🖼️ Portfolio Page
- **Interactive Gallery**: Grid display of 45+ Minecraft build examples
- **Image Popup Viewer**: Click-to-expand functionality with full-screen modal
- **Responsive Grid**: Adaptive layout (1-3 columns based on screen size)
- **Hover Effects**: Visual feedback with border color transitions and eye icon overlay

### 💼 Services Page
- **Pricing Plans**: Six service categories with detailed pricing:
  - **Costruzione** (Sculptures): €50 - €300+
  - **Strutture Avanzate** (Advanced Structures): €200 - €500
  - **Costruzioni Base** (Basic Builds): €50 - €150
  - **Terraforming**: €150 - €400
  - **Skin Creation**: €20 - €50
  - **Progetti Custom** (Custom Projects): Quote-based
- **Feature Lists**: Each service includes delivery timelines and included features

### ⭐ Reviews Page
- **Customer Testimonials**: Detailed reviews from satisfied clients
- **Alternating Layout**: Reviews displayed with alternating left/right image placement
- **Client Information**: Shows customer avatars, roles (YouTuber/Server), and subscriber counts
- **5-Star Ratings**: Visual star rating system

### 📄 Terms of Service (TOS)
- **Comprehensive Terms**: Detailed service agreement covering:
  - Commitment and project selection
  - Deadlines and delivery process
  - Content restrictions
  - Revision policies
  - Communication guidelines
  - Usage rights
  - Payment terms

### 🎨 Design Features
- **Modern UI**: Built with Nuxt UI and Tailwind CSS
- **Responsive Design**: Mobile-first approach with breakpoints for all screen sizes
- **Smooth Animations**: Transitions, hover effects, and interactive elements
- **Custom Color Scheme**: Primary, secondary, and accent colors with theme support
- **Image Optimization**: WebP format for optimal performance using Nuxt Image

### 🔗 Navigation & Footer
- **Sticky Navigation Bar**: Always accessible with smooth scroll behavior
- **Social Media Links**: Integration with Discord, Twitter, Instagram, YouTube, Gmail, Telegram, and TikTok
- **Footer**: Copyright information and social media icons with glow effects

## 🛠️ Tech Stack

- **Framework**: [Nuxt 4.2.2](https://nuxt.com/)
- **UI Library**: [Nuxt UI 4.2.1](https://ui.nuxt.com/)
- **Styling**: [Tailwind CSS 4.1.18](https://tailwindcss.com/)
- **Image Optimization**: [Nuxt Image 2.0.0](https://image.nuxt.com/)
- **Language**: TypeScript 5.6.3
- **Runtime**: Vue 3.5.25

## 📁 Project Structure

```
leledan-ws/
├── app/
│   ├── assets/
│   │   └── css/
│   │       └── main.css
│   ├── components/
│   │   ├── CustomerCard.vue
│   │   ├── CustomerMarquee.vue
│   │   ├── HomeHero.vue
│   │   ├── NavBar.vue
│   │   ├── PageFooter.vue
│   │   ├── Review.vue
│   │   ├── ServiceCard.vue
│   │   ├── SkillIcon.vue
│   │   ├── SkillsBar.vue
│   │   └── WhoAmI.vue
│   ├── layouts/
│   │   └── default.vue
│   ├── pages/
│   │   ├── index.vue
│   │   ├── portfolio.vue
│   │   ├── reviews.vue
│   │   ├── services.vue
│   │   └── tos.vue
│   └── app.vue
├── public/
│   ├── background/        # Hero background images
│   ├── customers/        # Client avatars
│   ├── images/           # Logo and profile images
│   ├── portfolio/        # 45+ build showcase images
│   └── resources/        # SVG assets
├── nuxt.config.ts
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Package manager (npm, pnpm, yarn, or bun)

### Installation

```bash
# Install dependencies
bun install
# or
npm install
# or
pnpm install
# or
yarn install
```

### Development

Start the development server:

```bash
bun run dev
# or
npm run dev
# or
pnpm dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

### Build

Build for production:

```bash
bun run build
# or
npm run build
# or
pnpm build
# or
yarn build
```

### Preview

Preview the production build locally:

```bash
bun run preview
# or
npm run preview
# or
pnpm preview
# or
yarn preview
```

### Generate Static Site

Generate a static site:

```bash
bun run generate
# or
npm run generate
# or
pnpm generate
# or
yarn generate
# or
npx nuxi generate
```

## 📝 Key Components

- **NavBar**: Responsive navigation with icon-based menu items
- **HomeHero**: Animated hero section with background transitions
- **WhoAmI**: Personal introduction and profile section
- **SkillsBar**: Technical skills display with icons
- **CustomerMarquee**: Infinite scrolling customer showcase
- **ServiceCard**: Reusable pricing card component
- **Review**: Customer testimonial component with alternating layouts
- **PageFooter**: Footer with social media links and copyright

## 🎨 Customization

The project uses a custom color scheme defined in Tailwind CSS. Key colors include:
- `primary`: Main brand color
- `secondary`: Accent color
- `background`: Page background
- `text`: Text color
- `foreground`: Foreground elements

## 📱 Responsive Breakpoints

- Mobile: Default (< 640px)
- Tablet: `sm:` (≥ 640px)
- Desktop: `md:` (≥ 768px)
- Large Desktop: `lg:` (≥ 1024px)

## 🔍 SEO

- Meta tags configured for title and description
- Semantic HTML structure
- Optimized images with WebP format
- Robots.txt included

## Database (Cloudflare D1)

This site reads its featured "Premium Projects" / "Signature Builds" from a
Cloudflare D1 database (binding name `DB`, see `wrangler.toml`). The public
marketing pages are read-only; the only writes come from the admin
dashboard under `/app/*` (see the "Dashboard (`/app`)" section below) —
both live in this same app and share the same D1 binding.

- Local dev: `npm run dev` uses `nitro-cloudflare-dev` to emulate `DB`
  against a local SQLite file under `.wrangler/`.
- Migrations live in `server/database/migrations/*.sql`, applied in
  filename order.
- Apply migrations locally: `npm run db:migrate:local`
- Apply migrations to the deployed database: `npm run db:migrate:remote`
- Run the data-layer tests: `npm test`

## Dashboard (`/app`)

Admin + user dashboard, served from this same app under `/app/*`
(`/app/login`, `/app/register`, `/app`, `/app/posts`). Shares the same D1
database and binding as the public marketing pages — this is the only part
of the app with write access to the `posts` table, and the only part with
a `users` table.

Also manages: "Work Seen On" creators (`/app/work-seen-on`), customer
reviews (`/app/reviews`), and pricing plans (`/app/pricing`) — same pattern
as posts, each with its own D1 table and public read-only route
(`/api/work-seen-on`, `/api/reviews`, `/api/pricing`).

Also manages the `/browse` catalog (`/app/browse`) — same pattern, its own
D1 table (`browse_items`) and public read-only route (`/api/browse-items`).

### Image uploads

Dashboard forms with an image field (posts, work-seen-on, reviews, browse
items) upload real files to Cloudflare R2 (`server/api/admin/upload.post.ts`,
bucket `leledan-uploads`, binding `UPLOADS` in `wrangler.toml`) and serve
them back through this same Worker at `/uploads/:key`
(`server/routes/uploads/[key].get.ts`) — no second domain or R2 public
bucket setup needed. Like the SMTP feature, R2 is only genuinely available
under the real Workers runtime, so testing uploads locally needs
`npm run build && npx wrangler dev`, not plain `npm run dev`.

### Managed taxonomies (browse items)

`browse_items`' Build Type, Theme, and Category fields are selected from a
managed list (`build_types`/`themes`/`categories` D1 tables,
case-insensitive-unique) rather than free text, so a typo can't silently
create a duplicate/garbage value. Creating a genuinely new value is still
possible — it's a deliberate action in the dashboard's select field, not an
accident.

### Purchases (Stripe + PayPal)

Logged-in users (login required) can buy a `/browse` item once the admin has
attached a downloadable file to it (`/app/browse`'s "Downloadable file"
field — stored in R2 under `deliverables/`, key kept in
`browse_items.download_key`, never exposed to non-admin API responses).
Checkout uses Stripe's hosted Checkout Session and PayPal's Orders v2
redirect flow — no card data ever touches this app. Both providers confirm
payment through a signature-verified webhook
(`server/api/webhooks/stripe.post.ts`, `server/api/webhooks/paypal.post.ts`);
PayPal additionally captures on the buyer's return
(`server/api/checkout/paypal-return.get.ts`), since its redirect-only flow
needs an explicit capture call before the webhook arrives. Every payment
attempt is one row in the `orders` table; a row only becomes `completed`
once a provider confirms the money moved.

Purchased files are served only through
`GET /api/downloads/:browseItemId`, which checks the requester has a
`completed` order for that exact item before streaming the file out of R2
with `Content-Disposition: attachment` — the underlying R2 key is never
sent to any client. Logged-in users see their completed purchases with a
Download button at `/app/purchases` (linked from the dashboard sidebar for
every logged-in user, not just admins).

Requires `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYPAL_CLIENT_ID`,
`PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_API_BASE` as env vars /
Cloudflare secrets — see `.dev.vars.example`. Local webhook delivery needs a
tunnel, since Stripe/PayPal call the webhook URL from their own servers:
use the Stripe CLI (`stripe listen --forward-to <local-url>/api/webhooks/stripe`)
for Stripe, and a tunnel (ngrok/cloudflared) plus PayPal's sandbox webhook
simulator for PayPal.

`PUBLIC_ORIGIN` (see "Email verification" below for its general purpose) is
**required in production** for payments specifically: it determines both
Stripe's success/cancel URLs and PayPal's return URL. Leaving it unset in
production would let those redirect URLs be influenced by a client-supplied
`Host` header — it's optional only for local dev, where it falls back to
the request's own origin.

#### Reconciling stuck orders

There is currently no admin UI for this — an order can be legitimately
stuck `pending` (buyer abandoned checkout, chose a delayed payment method
and hasn't settled yet) or stuck due to a bug (a mismatch the webhook/return
route refuses to resolve). To find candidates for manual investigation:

```sql
SELECT * FROM orders WHERE status = 'pending' AND created_at < datetime('now','-1 hour');
```

Alert on these log markers, all of which indicate a payment that will never
complete on its own: `[stripe-webhook] amount mismatch`, any `[paypal-webhook]`
line starting with "give up", and any `[paypal-return]` line mentioning
"mismatch".

Refunds and chargebacks do **not** currently revoke download access — an
order marked `completed` stays `completed`, and its buyer keeps their
download button at `/app/purchases`, regardless of what happens at the
provider afterward.

### Local dev

1. Copy `.dev.vars.example` to `.dev.vars` and fill in `SESSION_SECRET`
   (any long random string, 32+ chars).
2. `npm run db:migrate:local` (applies the `users` table migration if not
   already applied).
3. `ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... node scripts/seed-admin.mjs`
4. `npm run dev`, then visit `/app/login`.

### Deploy

`npx wrangler d1 migrations apply leledan-builds --remote` before the first
deploy that includes the `users` table. Set `SESSION_SECRET` as a
Cloudflare Workers secret (not in any committed file):
`npx wrangler secret put SESSION_SECRET`.

### Email verification

New `role='user'` registrations must verify their email before logging in.
Verification emails are sent via real Gmail SMTP over a raw TCP socket
(`server/lib/smtp.ts`, using Cloudflare's `cloudflare:sockets` API — this
is why it's hand-rolled instead of using `nodemailer`, which needs Node's
`net`/`tls` and doesn't run in Workers). Requires `SMTP_USER`/
`SMTP_PASSWORD` (a Gmail address + an
[app password](https://myaccount.google.com/apppasswords), not the account
password) as env vars / Cloudflare secrets — see `.dev.vars.example`.

`PUBLIC_ORIGIN` (optional) sets the domain used in verification links —
set it explicitly in production (e.g. `https://leledanbuilds.com`) so the
link's domain can never be influenced by a client-supplied `Host` header.
Local dev falls back to the request's own origin when unset, so it's not
required there.

**`npm run dev` cannot exercise SMTP-dependent routes** — `cloudflare:sockets`
only exists in the real Cloudflare Workers runtime (`workerd`), not in
`nitro-cloudflare-dev`'s Node-based local dev server (an alias in
`nuxt.config.ts` keeps this from breaking *other*, non-email routes under
`npm run dev`, but the email-sending routes themselves still can't run
there). To test registration/verification/resend locally end to end, build
and run the real Workers runtime instead:
```bash
npm run build && npx wrangler dev
```

## 📄 License

Private project - All rights reserved.

---

**Built with ❤️ for the Minecraft building community**
