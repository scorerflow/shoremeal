# Stripe Setup Guide for Forzafed

## Overview
Stripe is fully integrated in the code. This guide walks you through configuring products and webhooks in Stripe Dashboard.

---

## Step 1: Create Stripe Account

1. Go to https://dashboard.stripe.com/register
2. Sign up with your business email (hello@forzafed.com)
3. Complete business verification
4. **Keep Test Mode enabled** (top right toggle should say "Test mode")

---

## Step 2: Create Products

### Navigate to Products
1. Go to https://dashboard.stripe.com/test/products
2. Click **"+ Add product"**

### Create Starter Tier
1. **Product name:** Forzafed - Starter
2. **Description:** 10 nutrition plans per month with basic branding
3. **Pricing model:** Standard pricing
4. **Price:** £29.00
5. **Billing period:** Monthly
6. **Payment type:** Recurring
7. Click **"Add product"**
8. **IMPORTANT:** Copy the **Price ID** (starts with `price_...`)
   - It will look like: `price_1ABC123def456GHI`
   - Save this for later as **STRIPE_PRICE_STARTER**

### Create Pro Tier
1. Click **"+ Add product"** again
2. **Product name:** Forzafed - Pro
3. **Description:** 30 nutrition plans per month with full branding
4. **Pricing model:** Standard pricing
5. **Price:** £49.00
6. **Billing period:** Monthly
7. **Payment type:** Recurring
8. Click **"Add product"**
9. **Copy the Price ID** → Save as **STRIPE_PRICE_PRO**

### Create Agency Tier
1. Click **"+ Add product"** again
2. **Product name:** Forzafed - Agency
3. **Description:** 100 nutrition plans per month with white-label branding and API access
4. **Pricing model:** Standard pricing
5. **Price:** £99.00
6. **Billing period:** Monthly
7. **Payment type:** Recurring
8. Click **"Add product"**
9. **Copy the Price ID** → Save as **STRIPE_PRICE_AGENCY**

---

## Step 3: Get API Keys

### Get Secret Key
1. Go to https://dashboard.stripe.com/test/apikeys
2. Find **"Secret key"** (starts with `sk_test_...`)
3. Click **"Reveal test key"**
4. Copy the key → Save as **STRIPE_SECRET_KEY**

### Get Publishable Key
1. On the same page, find **"Publishable key"** (starts with `pk_test_...`)
2. Copy the key → Save as **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**

---

## Step 4: Configure Webhook

### Create Webhook Endpoint
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **"+ Add endpoint"**
3. **Endpoint URL:**
   - For production: `https://www.forzafed.com/api/webhook`
   - For local testing: Use ngrok (see below)
4. **Description:** Forzafed subscription events
5. **Events to send:** Click "Select events"
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. Click **"Add endpoint"**
7. **Copy the Signing Secret** (starts with `whsec_...`) → Save as **STRIPE_WEBHOOK_SECRET**

---

## Step 5: Update Environment Variables

### Local Development (.env.local)
Update your `saas/.env.local` file:

```bash
# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXX
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXX
STRIPE_PRICE_STARTER=price_XXXXXXXXXXXXX
STRIPE_PRICE_PRO=price_XXXXXXXXXXXXX
STRIPE_PRICE_AGENCY=price_XXXXXXXXXXXXX
```

### Production (Vercel Dashboard)
1. Go to https://vercel.com/scorerflow/shoremeal/settings/environment-variables
2. Add/update these variables (use PRODUCTION keys when ready):
   - `STRIPE_SECRET_KEY` → Your secret key
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → Your publishable key
   - `STRIPE_WEBHOOK_SECRET` → Your webhook signing secret
   - `STRIPE_PRICE_STARTER` → Starter price ID
   - `STRIPE_PRICE_PRO` → Pro price ID
   - `STRIPE_PRICE_AGENCY` → Agency price ID

---

## Step 6: Test Locally with ngrok (Optional)

To test webhooks locally:

1. Install ngrok: `brew install ngrok`
2. Run ngrok: `ngrok http 3000`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Add webhook endpoint in Stripe: `https://abc123.ngrok.io/api/webhook`
5. Copy the signing secret to `.env.local`
6. Start your dev server: `npm run dev`

---

## Step 7: Test Checkout Flow

### Test Card Numbers
Stripe provides test cards that simulate different scenarios:

**Successful payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

**Payment requires authentication (3D Secure):**
- Card: `4000 0025 0000 3155`

**Card declined:**
- Card: `4000 0000 0000 9995`

**Insufficient funds:**
- Card: `4000 0000 0000 9995`

### Test the Flow
1. Go to http://localhost:3000/pricing (or https://www.forzafed.com/pricing)
2. Click "Get Started" on any tier
3. You'll be redirected to Stripe Checkout
4. Use test card `4242 4242 4242 4242`
5. Complete the checkout
6. Verify you're redirected back to `/dashboard?success=true`
7. Check your subscription is active in Settings

### Verify Webhooks
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. Check the "Events" tab - you should see events like:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `invoice.payment_succeeded`
4. All events should show status "Succeeded"

---

## Step 8: Customer Portal Configuration

The customer portal allows users to cancel/update subscriptions.

1. Go to https://dashboard.stripe.com/test/settings/billing/portal
2. **Enable** the following features:
   - ✅ Allow customers to update their payment methods
   - ✅ Allow customers to cancel subscriptions (with optional retention offers)
   - ✅ Allow customers to switch plans
3. **Cancellation behavior:**
   - Select "Cancel at end of billing period" (user retains access until paid period ends)
4. Click **"Save changes"**

---

## Step 9: Production Checklist (When Ready)

Before going live with real payments:

1. **Switch to Live Mode** in Stripe Dashboard (toggle top right)
2. **Create products** in Live Mode (repeat Step 2)
3. **Get Live API keys** (not test keys)
4. **Create webhook** for production URL: `https://www.forzafed.com/api/webhook`
5. **Update Vercel env vars** with LIVE keys
6. **Activate Stripe account:**
   - Complete business verification
   - Add bank account for payouts
   - Set up tax settings
7. **Test with real card** (your own)
8. **Immediately cancel** the test subscription
9. **Launch!** 🚀

---

## Troubleshooting

### Webhook not receiving events
- Check webhook URL is correct
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Check Vercel logs: `vercel logs forzafed.com --follow`
- Test locally with ngrok first

### Checkout button not working
- Check browser console for errors
- Verify all `STRIPE_PRICE_*` env vars are set
- Ensure you're logged in (checkout requires auth)

### Subscription not showing in dashboard
- Check webhook events processed successfully
- Check Supabase `trainers` table for `subscription_tier` and `subscription_status`
- Check `audit_log` table for subscription events

---

## Support

- **Stripe Documentation:** https://stripe.com/docs
- **Stripe Support:** https://support.stripe.com
- **Forzafed Support:** hello@forzafed.com

---

## Summary

**What you need to collect:**
1. ✅ Secret Key (sk_test_...)
2. ✅ Publishable Key (pk_test_...)
3. ✅ Webhook Secret (whsec_...)
4. ✅ Starter Price ID (price_...)
5. ✅ Pro Price ID (price_...)
6. ✅ Agency Price ID (price_...)

**Where to put them:**
- Local: `saas/.env.local`
- Production: Vercel Dashboard → Environment Variables

**Next:**
- Test checkout flow with `4242 4242 4242 4242`
- Verify webhooks are processing
- When ready: switch to Live Mode and launch! 🎉
