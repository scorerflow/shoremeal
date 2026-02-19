-- NutriPlan Pro Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trainers table (extends Supabase auth.users)
CREATE TABLE trainers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    business_name TEXT,
    stripe_customer_id TEXT UNIQUE,
    subscription_tier TEXT CHECK (subscription_tier IN ('starter', 'pro', 'agency')),
    subscription_status TEXT CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trialing')),
    plans_used_this_month INTEGER DEFAULT 0,
    billing_cycle_start TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Branding table (trainer customisation)
CREATE TABLE branding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    logo_url TEXT,
    primary_colour TEXT DEFAULT '#2C5F2D',
    secondary_colour TEXT DEFAULT '#4A7C4E',
    accent_colour TEXT DEFAULT '#FF8C00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(trainer_id)
);

-- Clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    form_data JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plans table
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    pdf_url TEXT NOT NULL,
    plan_text TEXT,
    generation_cost DECIMAL(10, 4) DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_trainers_stripe_customer ON trainers(stripe_customer_id);
CREATE INDEX idx_trainers_email ON trainers(email);
CREATE INDEX idx_clients_trainer ON clients(trainer_id);
CREATE INDEX idx_plans_trainer ON plans(trainer_id);
CREATE INDEX idx_plans_client ON plans(client_id);
CREATE INDEX idx_plans_created ON plans(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Trainers can only see their own data
CREATE POLICY "Trainers can view own profile" ON trainers
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Trainers can update own profile" ON trainers
    FOR UPDATE USING (auth.uid() = id);

-- Branding policies
CREATE POLICY "Trainers can view own branding" ON branding
    FOR SELECT USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can insert own branding" ON branding
    FOR INSERT WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update own branding" ON branding
    FOR UPDATE USING (auth.uid() = trainer_id);

-- Clients policies
CREATE POLICY "Trainers can view own clients" ON clients
    FOR SELECT USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can insert own clients" ON clients
    FOR INSERT WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update own clients" ON clients
    FOR UPDATE USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete own clients" ON clients
    FOR DELETE USING (auth.uid() = trainer_id);

-- Plans policies
CREATE POLICY "Trainers can view own plans" ON plans
    FOR SELECT USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can insert own plans" ON plans
    FOR INSERT WITH CHECK (auth.uid() = trainer_id);

-- Function to create trainer profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO trainers (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );

    -- Create default branding
    INSERT INTO branding (trainer_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Function to reset monthly plan usage (run via Supabase cron)
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
    UPDATE trainers
    SET plans_used_this_month = 0,
        billing_cycle_start = NOW()
    WHERE billing_cycle_start < NOW() - INTERVAL '1 month'
       OR billing_cycle_start IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to increment plan usage
CREATE OR REPLACE FUNCTION increment_plan_usage(trainer_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE trainers
    SET plans_used_this_month = plans_used_this_month + 1,
        updated_at = NOW()
    WHERE id = trainer_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Migration: Scalability & Security Architecture
-- ============================================================

-- Add async plan generation columns to plans table
ALTER TABLE plans ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'generating', 'completed', 'failed'));
ALTER TABLE plans ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Make pdf_url nullable (won't exist until generation completes)
ALTER TABLE plans ALTER COLUMN pdf_url DROP NOT NULL;
ALTER TABLE plans ALTER COLUMN pdf_url SET DEFAULT NULL;

-- Indexes for plan status queries
CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status);
CREATE INDEX IF NOT EXISTS idx_plans_trainer_status ON plans(trainer_id, status);

-- Webhook events table (Stripe idempotency)
CREATE TABLE IF NOT EXISTS webhook_events (
    id TEXT PRIMARY KEY, -- Stripe event ID as PK for O(1) idempotency
    event_type TEXT NOT NULL,
    payload JSONB,
    status TEXT NOT NULL DEFAULT 'processing'
        CHECK (status IN ('processing', 'processed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- RLS on new tables: service role only
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
-- No user-facing policies - only service role can access these tables

-- Function to increment plan attempts
CREATE OR REPLACE FUNCTION increment_plan_attempts(plan_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE plans
    SET attempts = attempts + 1,
        updated_at = NOW()
    WHERE id = plan_uuid;
END;
$$ LANGUAGE plpgsql;
