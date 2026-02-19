# Forzafed - SaaS Platform

Professional nutrition plan generator for personal trainers and nutritionists.

## Quick Start

### 1. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema in `supabase/schema.sql`
3. Get your project URL and keys from Settings > API

### 2. Set Up Stripe

1. Create account at [stripe.com](https://stripe.com)
2. Create 3 products with monthly prices:
   - Starter: £29/month
   - Pro: £49/month
   - Agency: £99/month
3. Copy the Price IDs for each tier
4. Set up webhook endpoint: `https://your-domain.com/api/webhook`
5. Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Fill in your keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_STARTER=price_xxx
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_AGENCY=price_xxx

ANTHROPIC_API_KEY=sk-ant-xxx

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
saas/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── checkout/     # Stripe checkout
│   │   │   ├── webhook/      # Stripe webhooks
│   │   │   ├── billing/      # Customer portal
│   │   │   └── generate/     # Plan generation
│   │   ├── dashboard/        # Protected dashboard
│   │   ├── login/            # Auth pages
│   │   └── signup/
│   ├── components/           # Reusable components
│   ├── lib/
│   │   ├── supabase/         # Supabase clients
│   │   └── stripe.ts         # Stripe helpers
│   └── types/                # TypeScript types
├── supabase/
│   └── schema.sql            # Database schema
└── public/                   # Static assets
```

## Features

- **Authentication**: Email/password via Supabase Auth
- **Subscriptions**: 3 tiers (Starter £29, Pro £49, Agency £99)
- **Plan Limits**: 10/30/100 plans per month
- **Plan Generation**: AI-powered via Claude API
- **White-label**: Custom logo and colours (per trainer)
- **Mobile-first**: Responsive design

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Build for production:
```bash
npm run build
npm start
```

## Subscription Tiers

| Tier | Price | Plans/Month | Features |
|------|-------|-------------|----------|
| Starter | £29 | 10 | Basic branding |
| Pro | £49 | 30 | Full branding + history |
| Agency | £99 | 100 | White-label + API |

## API Costs

- ~£0.16 per 7-day plan (Claude Sonnet)
- At £49/month with 30 plans: £4.80 API cost = 90% margin

## Next Steps

- [ ] Add PDF generation (integrate existing Python service)
- [ ] Add plan view/download page
- [ ] Add settings page for branding
- [ ] Add client list page
- [ ] Add plan history page
- [ ] Test Stripe webhooks locally with CLI
- [ ] Deploy to Vercel
