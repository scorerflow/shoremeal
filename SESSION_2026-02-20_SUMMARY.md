# Session 2026-02-20 - Test Infrastructure Complete + MVP Roadmap

## TL;DR
Completed test database setup, fixed CI/CD, added comprehensive validation tests, and implemented meal variety + form standardization features. Defined clear path to production MVP.

---

## What We Accomplished Today

### ✅ 1. Test Database Setup (COMPLETE)
**Problem**: Testing infrastructure was built but couldn't run (no test database)

**What we did:**
- Created test Supabase project: `zdllrnidqxmictczzutb`
- Configured `.env.test` with test credentials (gitignored)
- Applied full schema to test database
- Fixed test email domains: `@test.test` → `@example.com` (Supabase validation)
- Disabled email confirmation + rate limits in test project
- **Result**: All 11 integration tests passing

### ✅ 2. CI/CD Pipeline Fixed (COMPLETE)
**Problems**: Missing dependencies, linting errors

**What we did:**
- Added `@vitest/coverage-v8` dependency for coverage reports
- Configured ESLint with `next/core-web-vitals` preset
- Fixed ESLint disable comments (removed TypeScript-specific rule names)
- Set up GitHub repository secrets:
  - `TEST_SUPABASE_URL`
  - `TEST_SUPABASE_ANON_KEY`
  - `TEST_SUPABASE_SERVICE_KEY`
- **Result**: Full CI/CD working - tests + lint on every push

### ✅ 3. Feature: Meal Variety (COMPLETE)
**User requirement**: "Many people batch cook the same meals for 2-3 days"

**What we built:**
- Updated `MEAL_PREP_STYLES` constant with new labels:
  - `daily` → "High variety (different meals daily)"
  - `batch` → "Moderate variety (batch cooking - meals repeat every 2-3 days)"
  - `mixed` → "Low variety (same meals all week)"
- Updated form label: "Meal Prep Style" → "Meal Variety"
- Updated AI prompt with specific instructions for each variety level
- Changed default from `mixed` to `batch` (most common use case)
- Updated client detail page display

**Files changed:**
- `saas/src/lib/constants.ts`
- `saas/src/components/steps/PracticalDetailsStep.tsx`
- `saas/src/lib/inngest/functions.ts` (AI prompt)
- `saas/src/app/dashboard/clients/[id]/page.tsx`

### ✅ 4. Feature: Form Units Standardization (COMPLETE)
**User requirement**: "Lock down form values with explicit units"

**What we built:**
- Updated all form labels to include units:
  - Age (years)
  - Height (cm)
  - Weight (kg)
  - Goal Weight (kg)
  - Weekly Budget (£)
  - Plan Duration (days)
  - Meals per day (number)
- Updated placeholders to match units (removed "kg", "cm" from examples)
- Budget: removed "£" prefix from input (now just number)

**Files changed:**
- `saas/src/components/steps/PersonalInfoStep.tsx`
- `saas/src/components/steps/PracticalDetailsStep.tsx`
- `saas/src/app/dashboard/clients/new/page.tsx` (default values)

### ✅ 5. Validation Improvements (COMPLETE)
**Problem**: Numeric fields validated as strings, no range enforcement

**What we fixed:**
- Converted to proper numeric validation with `z.coerce.number()`
- Added strict ranges:
  - Age: 16-100 years
  - Height: 140-220 cm
  - Weight: 40-200 kg (current + goal)
  - Budget: £10-1000
  - Meals per day: 2-6
  - Plan duration: 3-30 days
  - Prep time: 10-120 minutes
- All numeric fields now integers where appropriate
- Maintained security: HTML stripping, input sanitization

**File changed:**
- `saas/src/lib/validation.ts`

### ✅ 6. Comprehensive Testing (TDD APPROACH)
**Philosophy established**: "Test all user entry points, especially for security"

**What we built:**
- Created `tests/unit/validation.test.ts` with 43 tests covering:
  - All numeric ranges and boundaries
  - Enum validation for all dropdowns
  - Type coercion (string → number)
  - XSS prevention (HTML/script stripping)
  - Required vs optional fields
  - Edge cases and security vulnerabilities
- **All 54 tests passing** (43 new + 11 existing)

**Test files:**
- `saas/tests/unit/validation.test.ts` (NEW)
- `saas/tests/integration/auth/session-isolation.test.ts` (existing)
- `saas/tests/integration/rls/data-isolation.test.ts` (existing)

---

## Current System State

### ✅ What's Production-Ready
- **Core functionality**: Plan generation working end-to-end
- **Security**: Auth + RLS + rate limiting + input validation
- **Payments**: Stripe integration (£29/49/99 tiers)
- **Testing**: 54 tests, CI/CD pipeline blocking bad code
- **Infrastructure**: Async jobs (Inngest), audit logs, usage tracking
- **Branding**: White-label PDFs with trainer's colors/logo
- **Domain secured**: forzafed.com (not connected yet)
- **Validation**: Comprehensive with 43 tests

### ⚠️ What's Missing for MVP

**TIER 1: Blockers (must ship before launch)**
1. ❌ Custom domain connection (forzafed.com → Vercel)
2. ❌ Legal pages (Privacy Policy + Terms of Service)
3. ❌ Email delivery (send PDFs to clients)
4. ❌ Error monitoring (Sentry or similar)

**TIER 2: Quality (should have for launch)**
5. ❌ Mobile responsive (not tested yet)
6. ❌ Plan regeneration ("Generate New Plan" button)
7. ❌ Email notifications (plan ready, subscription updates)
8. ❌ Basic analytics (PostHog/Plausible)

**TIER 3: Polish (nice to have)**
9. ❌ Better loading states
10. ❌ Onboarding guide
11. ❌ Usage limit enforcement UI
12. ❌ Plan search/filter

---

## Technical Details for Tomorrow

### Test Database Info
- **Project ID**: `zdllrnidqxmictczzutb`
- **URL**: `https://zdllrnidqxmictczzutb.supabase.co`
- **Credentials**: In `saas/.env.test` (gitignored)
- **Settings**:
  - Email confirmation: DISABLED
  - Email signup rate limit: 9999/hour
  - Auth provider: Email only

### GitHub Secrets Configured
```
TEST_SUPABASE_URL
TEST_SUPABASE_ANON_KEY
TEST_SUPABASE_SERVICE_KEY
```

### Running Tests Locally
```bash
cd saas
npm test                    # Run all tests
npm test -- validation      # Run validation tests only
npm test -- --coverage      # Generate coverage report
```

### Key Validation Ranges (for reference)
```typescript
age: 16-100 years
height: 140-220 cm
weight: 40-200 kg
ideal_weight: 40-200 kg
budget: £10-1000
meals_per_day: 2-6
plan_duration: 3-30 days
prep_time: 10-120 minutes
```

### Meal Variety Values
```typescript
'daily'  → High variety (different meals daily)
'batch'  → Moderate variety (batch cooking - repeat every 2-3 days)
'mixed'  → Low variety (same meals all week)
```

---

## Commits This Session

1. `f6b89f5` - Set up test database and fix test email domains
2. `dd19656` - Add @vitest/coverage-v8 dependency for CI/CD
3. `cf564ca` - Configure ESLint and fix linting errors
4. `1234561` - Add meal variety feature + lock down form units with validation tests

---

## Recommended Action Plan for Tomorrow

### Option A: Launch Sprint (Aggressive - 2 weeks)
**Week 1:**
- Day 1: Domain + Legal pages
- Day 2-3: Email delivery feature
- Day 4: Error monitoring + analytics
- Day 5: Mobile responsive

**Week 2:**
- Day 1: Plan regeneration
- Day 2: Email notifications
- Day 3: Polish + loading states
- Day 4-5: Beta test with 3-5 trainers

**Week 3: Launch**

### Option B: Methodical (4-6 weeks)
- Ship features one at a time
- Test thoroughly between each
- Launch when comfortable

### Option C: Hybrid (Recommended - 3 weeks)
**Immediate (1 day):**
1. Connect forzafed.com domain (15 mins)
2. Add legal pages (2 hours)
3. Email delivery MVP (4 hours)

**Then:**
- Beta test with 3-5 friendly trainers
- Build Tier 2 based on feedback
- Launch in 3 weeks

---

## Next Session: Start Here

### Priority 1: Custom Domain (15 mins)
**Current**: `saas-jade-pi.vercel.app`
**Target**: `forzafed.com`

**Steps:**
1. Go to Vercel project settings
2. Add custom domain: `forzafed.com`
3. Update DNS at domain registrar:
   - Type: CNAME
   - Name: @ (or www)
   - Value: cname.vercel-dns.com
4. Wait for SSL cert (automatic)
5. Test: https://forzafed.com

### Priority 2: Legal Pages (2 hours)
**Why**: Stripe requirement, legal protection

**Options:**
- Use generator: https://termly.io or https://getterms.io
- Or: Copy/adapt from similar SaaS
- Must include: GDPR compliance, data handling, payment terms

**Pages needed:**
- `/privacy` - Privacy Policy
- `/terms` - Terms of Service
- Link from footer + signup page

### Priority 3: Email Delivery (4 hours)
**Why**: Core UX gap - trainers want to send plans directly

**Tech stack:**
- Resend (resend.com) or SendGrid
- Attach PDF to email
- Store "sent to" email in database

**Implementation:**
1. Add email field to plan generation form
2. Update `generatePlan` Inngest function
3. Send email with PDF attachment
4. Add "Resend Email" button on plan detail page

---

## Key Files Reference

### Testing
- `saas/tests/unit/validation.test.ts` - 43 validation tests
- `saas/tests/integration/auth/session-isolation.test.ts` - Session tests
- `saas/tests/integration/rls/data-isolation.test.ts` - RLS tests
- `saas/tests/helpers/auth.ts` - Auth test utilities
- `saas/tests/helpers/db.ts` - Database test utilities
- `saas/tests/setup.ts` - Global test setup
- `.github/workflows/test.yml` - CI/CD pipeline

### Form & Validation
- `saas/src/lib/validation.ts` - Zod schemas
- `saas/src/components/steps/PersonalInfoStep.tsx` - Step 1 form
- `saas/src/components/steps/ActivityGoalsStep.tsx` - Step 2 form
- `saas/src/components/steps/DietaryStep.tsx` - Step 3 form
- `saas/src/components/steps/PracticalDetailsStep.tsx` - Step 4 form (meal variety)
- `saas/src/app/dashboard/clients/new/page.tsx` - Form container

### Plan Generation
- `saas/src/lib/inngest/functions.ts` - Plan generation + AI prompt
- `saas/src/lib/pdf/generate.ts` - PDF generation
- `saas/src/lib/pdf/components.tsx` - PDF components
- `saas/src/lib/pdf/styles.ts` - PDF styling

### Constants & Config
- `saas/src/lib/constants.ts` - Form options (MEAL_PREP_STYLES, etc.)
- `saas/src/lib/config.ts` - App configuration

---

## Important Context

### User Expectations
- "Greatest architect level work"
- Test all user entry points, especially security
- Work with TDD (write tests for all changes)
- Build for scale from day one
- No patches - understand root causes
- Decisions based on THIS codebase, not generic best practices

### Project Philosophy
- **Quality over speed** - but ship fast with quality
- **Testing is mandatory** - especially for user input
- **Security first** - validate everything, trust nothing
- **White-label architecture** - trainers brand, not platform brand
- **Production-grade from start** - no "we'll fix it later"

### Tech Stack
- Next.js 14 App Router
- Supabase (PostgreSQL + Auth + RLS)
- Stripe (£29/49/99 tiers)
- Claude Sonnet 4.5 (~£0.15/plan)
- Inngest (async jobs)
- Upstash Redis (rate limiting)
- Vercel (hosting + auto-deploy)
- Vitest (testing)

---

## Success Metrics

### Current Stats
- **Tests**: 54 passing (43 validation + 11 integration)
- **Test coverage**: All user entry points
- **CI/CD**: Fully operational
- **Security warnings**: 0 (all fixed)
- **Production URL**: https://saas-jade-pi.vercel.app (temp)
- **Target URL**: https://forzafed.com (not connected)

### MVP Launch Goals
- 3-5 paying customers within first month
- 0 critical bugs in first week
- <2% churn rate
- <5 second plan generation time
- 99.9% uptime

---

## Questions for Tomorrow's Session

1. **Timeline preference**: Aggressive (2 weeks) vs Methodical (6 weeks) vs Hybrid (3 weeks)?
2. **Beta testers**: Do you have 3-5 friendly trainers lined up?
3. **Email provider**: Preference between Resend vs SendGrid?
4. **Analytics**: Privacy-focused (Plausible) or full-featured (PostHog)?
5. **Error monitoring**: Sentry (paid) or free alternative?

---

**Read full session details in:** `memory/MEMORY.md` → Will be updated with today's work
