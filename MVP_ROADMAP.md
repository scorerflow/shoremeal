# Forzafed MVP Launch Roadmap

**Status**: Testing infrastructure complete, core features working, ready for MVP push

**Target Launch**: 3 weeks from 2026-02-20 (Hybrid approach)

---

## Phase 1: Essential (Week 1) - Launch Blockers

### 1. Custom Domain ⏱️ 15 mins
**Priority**: CRITICAL
**Status**: ❌ Not started
**Why**: Professional credibility, brand trust, SEO

**Tasks:**
- [ ] Connect forzafed.com to Vercel
- [ ] Configure DNS (CNAME record)
- [ ] Verify SSL certificate
- [ ] Update all links/references
- [ ] Test production deployment

**Technical notes:**
- Current: saas-jade-pi.vercel.app
- Target: forzafed.com
- Vercel handles SSL automatically

---

### 2. Legal Pages ⏱️ 2 hours
**Priority**: CRITICAL (Stripe requirement)
**Status**: ❌ Not started
**Why**: Legal protection, GDPR compliance, payment processing requirement

**Tasks:**
- [ ] Privacy Policy page
- [ ] Terms of Service page
- [ ] Cookie policy (if using analytics)
- [ ] Add links to footer
- [ ] Link from signup page
- [ ] Store user acceptance timestamp

**Technical notes:**
- Use generator: termly.io or getterms.io
- Pages: `/privacy`, `/terms`
- Must cover: GDPR, data handling, Stripe payments, subscription terms

---

### 3. Email Delivery ⏱️ 4 hours
**Priority**: CRITICAL
**Status**: ❌ Not started
**Why**: Core UX gap - trainers need to send plans to clients directly

**Tasks:**
- [ ] Choose email provider (Resend recommended)
- [ ] Set up email service account
- [ ] Add email field to plan generation form
- [ ] Update Inngest function to send email
- [ ] Attach PDF to email
- [ ] Design email template
- [ ] Add "Resend Email" button on plan detail page
- [ ] Store "sent to" email in database
- [ ] Add email sending tests
- [ ] Handle email failures gracefully

**Technical notes:**
- Provider: Resend (developer-friendly) or SendGrid (reliable)
- Attach PDF as base64 or stream
- Add email column to plans table
- Update form validation to include email
- Rate limit email sending

**API Integration:**
```typescript
// In Inngest function after PDF generation
await resend.emails.send({
  from: 'plans@forzafed.com',
  to: clientEmail,
  subject: `Your Nutrition Plan from ${trainerName}`,
  html: emailTemplate,
  attachments: [{
    filename: `nutrition-plan-${clientName}.pdf`,
    content: pdfBuffer,
  }],
})
```

---

### 4. Error Monitoring ⏱️ 30 mins
**Priority**: HIGH
**Status**: ❌ Not started
**Why**: Can't fix what you can't see

**Tasks:**
- [ ] Set up Sentry account
- [ ] Install Sentry SDK
- [ ] Configure error boundaries
- [ ] Add source maps for better stack traces
- [ ] Set up Slack/email alerts for critical errors
- [ ] Test error reporting
- [ ] Document error response process

**Technical notes:**
- Sentry has free tier (5K events/month)
- Catch client + server errors
- Add user context to error reports
- Configure release tracking

---

## Phase 2: Quality (Week 2) - Should Have

### 5. Mobile Responsive ⏱️ 3 hours
**Priority**: HIGH
**Status**: ❌ Not tested
**Why**: 40%+ of traffic will be mobile

**Tasks:**
- [ ] Test on real devices (iOS + Android)
- [ ] Test form on mobile (4-step wizard)
- [ ] Test dashboard layout
- [ ] Test plan detail page
- [ ] Fix any layout issues
- [ ] Test PDF viewing on mobile
- [ ] Add mobile-specific improvements
- [ ] Test touch interactions

**Devices to test:**
- iPhone (Safari)
- Android (Chrome)
- Tablet (iPad)

---

### 6. Plan Regeneration ⏱️ 2 hours
**Priority**: HIGH
**Status**: ❌ Not started
**Why**: If user doesn't like plan, they're stuck

**Tasks:**
- [ ] Add "Generate New Plan" button on plan detail page
- [ ] Pre-fill form with existing client data
- [ ] Allow editing before regeneration
- [ ] Show plan history
- [ ] Track regeneration count
- [ ] Add tests for regeneration flow

**Technical notes:**
- Reuse existing form component
- Pre-populate from client's form_data
- Create new plan entry (keep history)
- Increment usage counter

---

### 7. Email Notifications ⏱️ 2 hours
**Priority**: MEDIUM
**Status**: ❌ Not started
**Why**: User engagement, reduce support questions

**Tasks:**
- [ ] Plan generation complete email
- [ ] Subscription confirmation email
- [ ] Payment success/failure emails
- [ ] Usage limit warning (90% used)
- [ ] Monthly usage reset notification
- [ ] Create email templates
- [ ] Add unsubscribe mechanism
- [ ] Test all notification triggers

**Emails needed:**
1. Plan ready: "Your nutrition plan for [Client] is ready!"
2. Subscription: "Welcome to Forzafed [Tier]"
3. Payment: "Payment received - £[amount]"
4. Usage: "You've used [X] of [Y] plans this month"

---

### 8. Basic Analytics ⏱️ 1 hour
**Priority**: MEDIUM
**Status**: ❌ Not started
**Why**: Data-driven decisions, measure success

**Tasks:**
- [ ] Choose analytics provider
- [ ] Install tracking script
- [ ] Track key events:
  - [ ] Signups
  - [ ] Plan generations
  - [ ] Subscription purchases
  - [ ] Cancellations
- [ ] Set up conversion funnels
- [ ] Create dashboard

**Recommended**: PostHog (self-hosted) or Plausible (privacy-friendly)

**Key metrics to track:**
- Signup → First plan (activation)
- Plan generation → PDF download
- Trial → Paid conversion
- Monthly retention rate
- Usage per customer

---

## Phase 3: Polish (Week 3) - Nice to Have

### 9. Better Loading States ⏱️ 1 hour
**Priority**: LOW
**Status**: ❌ Not complete
**Why**: Improves perceived performance

**Tasks:**
- [ ] Add loading skeletons to dashboard
- [ ] Add spinners to async operations
- [ ] Add progress indicator for plan generation
- [ ] Add optimistic updates where possible
- [ ] Add loading states to form submission
- [ ] Add transition animations

---

### 10. Onboarding Guide ⏱️ 2 hours
**Priority**: LOW
**Status**: ❌ Not started
**Why**: Reduce time to first plan

**Tasks:**
- [ ] Welcome modal on first login
- [ ] Checklist: Add branding → Create client → Generate plan
- [ ] Tooltips for key features
- [ ] Sample client data option
- [ ] "Skip" option for experienced users
- [ ] Track completion rate

---

### 11. Usage Limit Enforcement ⏱️ 2 hours
**Priority**: MEDIUM
**Status**: ⚠️ Tracked but not enforced clearly
**Why**: Prevent abuse, encourage upgrades

**Tasks:**
- [ ] Show remaining plans on dashboard
- [ ] Block generation when limit reached
- [ ] Show upgrade prompt when blocked
- [ ] Add "Usage" page showing history
- [ ] Add grace period (1-2 extra plans)
- [ ] Email when limit reached

**Current state:**
- Usage tracked in `plans_used_this_month`
- Need to enforce in `/api/generate`

---

### 12. Plan Search/Filter ⏱️ 2 hours
**Priority**: LOW
**Status**: ❌ Not started
**Why**: Hard to find old plans at scale

**Tasks:**
- [ ] Add search bar on plans page
- [ ] Filter by client
- [ ] Filter by date range
- [ ] Sort by: newest, oldest, client name
- [ ] Add pagination (if >50 plans)

---

## Launch Checklist

### Pre-Launch (Day Before)
- [ ] All Tier 1 features complete and tested
- [ ] Domain connected and SSL working
- [ ] Legal pages live and linked
- [ ] Error monitoring configured
- [ ] Analytics tracking verified
- [ ] Email delivery tested (send test plans)
- [ ] Mobile tested on real devices
- [ ] Load testing (stress test with 100 concurrent users)
- [ ] Security audit (penetration testing)
- [ ] Backup strategy verified
- [ ] Rollback plan documented

### Launch Day
- [ ] Deploy to production
- [ ] Smoke test all critical flows
- [ ] Monitor error rates
- [ ] Monitor performance
- [ ] Post on social media
- [ ] Email beta testers
- [ ] Watch analytics dashboard
- [ ] Be ready for support questions

### Post-Launch (First Week)
- [ ] Daily error monitoring
- [ ] Gather user feedback
- [ ] Fix critical bugs immediately
- [ ] Monitor payment processing
- [ ] Track conversion rates
- [ ] Iterate based on feedback

---

## Beta Testing Strategy

### Phase 1: Alpha (3-5 trainers)
**Goal**: Find breaking bugs, validate core flow

**Testers**: Friendly trainers who understand it's early

**Tasks:**
- [ ] Recruit 3-5 trainers
- [ ] Give free Pro tier for 1 month
- [ ] Ask for detailed feedback
- [ ] Schedule 1-on-1 calls
- [ ] Fix critical issues
- [ ] Gather feature requests

**Success criteria:**
- All testers generate at least 3 plans
- No critical bugs reported
- Average satisfaction: 8/10+

### Phase 2: Closed Beta (20-30 trainers)
**Goal**: Validate pricing, test at scale

**Testers**: Real paying customers (discounted)

**Tasks:**
- [ ] Offer 50% off first month
- [ ] Gather quantitative data
- [ ] Track usage patterns
- [ ] Monitor churn rate
- [ ] Optimize based on behavior

**Success criteria:**
- 80%+ retention after month 1
- <5% error rate
- Payment processing: 100% success

---

## Success Metrics

### Week 1
- 3-5 beta users onboarded
- 15+ plans generated
- 0 critical bugs
- <1s API response time

### Month 1
- 10+ paying customers
- £300+ MRR
- <10% churn rate
- 95%+ uptime

### Month 3
- 30+ paying customers
- £1,000+ MRR
- <5% churn rate
- Net Promoter Score: 50+

---

## Risk Mitigation

### Technical Risks
1. **Email deliverability**: Use reputable provider (Resend), warm up domain
2. **AI costs spike**: Set max tokens, monitor usage, cache common requests
3. **Database performance**: Optimize queries, add indexes, consider read replicas
4. **Rate limit abuse**: Implement strict limits, require email verification

### Business Risks
1. **Low conversion**: Offer trial plans, improve onboarding, gather feedback
2. **High churn**: Focus on retention, add value features, improve UX
3. **Competition**: Differentiate on UX, speed, white-label features
4. **Legal issues**: Have solid T&C, privacy policy, comply with GDPR

---

## Budget Estimate

### Monthly Operating Costs
```
Vercel Pro:           £20/mo
Supabase:             £0 (free tier, scale later)
Inngest:              £0 (free tier)
Resend:               £0 (3K emails/mo free)
Sentry:               £0 (5K events/mo free)
Domain:               £12/year (paid)
Claude API:           ~£5/mo (15 plans @ £0.15 each)
---
Total:                ~£25/mo
```

### Revenue Target
```
10 customers @ £29/mo = £290/mo
Margin:                 ~90% (£265/mo profit)
Break-even:             2 customers
```

---

## Questions for Product Owner

1. **Timeline**: Aggressive (2 weeks) or Hybrid (3 weeks)?
2. **Email provider**: Resend (dev-friendly) or SendGrid (enterprise)?
3. **Analytics**: PostHog (self-hosted) or Plausible (privacy)?
4. **Beta testers**: Do you have 3-5 friendly trainers ready?
5. **Pricing**: Keep current tiers (£29/49/99) or adjust?
6. **Features**: Any Tier 1-3 features you want to reprioritize?

---

**Last updated**: 2026-02-20
**Status**: Ready to begin Phase 1
