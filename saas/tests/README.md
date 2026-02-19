# Testing Infrastructure

Production-grade testing setup for NutriPlan Pro SaaS.

## Setup

### 1. Create Test Supabase Project

**DO NOT use your production database for tests!**

1. Go to https://supabase.com/dashboard
2. Create a new project called "nutriplan-test"
3. Copy the connection details

### 2. Configure Test Environment

```bash
cp .env.test.example .env.test
```

Edit `.env.test` with your test project credentials:
- `TEST_SUPABASE_URL`
- `TEST_SUPABASE_ANON_KEY`
- `TEST_SUPABASE_SERVICE_KEY`

### 3. Run Database Schema

In your test Supabase project SQL Editor, run:
```bash
cat supabase/schema.sql
```

Paste and execute the entire schema to set up tables, RLS policies, and functions.

### 4. Run Tests

```bash
npm test                  # Run all tests
npm test -- --watch       # Watch mode
npm test -- --coverage    # With coverage report
```

## Test Structure

```
tests/
├── setup.ts                    # Global test setup
├── helpers/                    # Test utilities
│   ├── auth.ts                # Auth helpers (create/delete users)
│   ├── db.ts                  # Database helpers (cleanup, clients)
│   └── factories.ts           # Test data generators (TODO)
├── integration/               # Integration tests
│   ├── auth/                  # Auth & session tests
│   │   └── session-isolation.test.ts
│   ├── rls/                   # RLS policy tests
│   │   └── data-isolation.test.ts
│   └── api/                   # API route tests (TODO)
└── unit/                      # Unit tests (TODO)
```

## Critical Tests

### ✅ Session Isolation (`auth/session-isolation.test.ts`)
Tests that users cannot see each other's data after signup/login/logout.
**This would have caught the reported session bug.**

### ✅ RLS Data Isolation (`rls/data-isolation.test.ts`)
Verifies Row Level Security policies prevent data leakage across:
- Trainers
- Clients
- Plans
- Branding

**CRITICAL for multi-tenancy at scale.**

## TODO: Phase 2

- [ ] API route tests (generate, checkout, webhooks)
- [ ] Stripe webhook idempotency tests
- [ ] Rate limiting tests
- [ ] E2E tests with Playwright
- [ ] CI/CD integration (GitHub Actions)

## Best Practices

1. **Always use test database** - Never test against production
2. **Clean up after tests** - Use `afterEach` to delete test data
3. **Test RLS policies** - Use user-scoped clients, not service role
4. **Verify data isolation** - Every table should have isolation tests
5. **Run tests before pushing** - Catch bugs before deployment

## Troubleshooting

**Error: Missing required test environment variables**
- Ensure `.env.test` exists with all required keys
- Verify test Supabase project is accessible

**RLS tests failing**
- Run schema.sql in test database
- Verify RLS is enabled: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- Check policies exist: `SELECT * FROM pg_policies`

**Tests timing out**
- Increase `testTimeout` in `vitest.config.ts`
- Check Supabase test project isn't paused
- Verify network connectivity

## Running in CI

See `.github/workflows/test.yml` for CI/CD configuration (TODO).
