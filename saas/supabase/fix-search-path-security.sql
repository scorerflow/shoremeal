-- Fix search_path security vulnerability in all functions
-- CORRECT FIX: Use 'public' schema, not empty string
-- This prevents hijacking while maintaining table access and RLS

-- Fix: handle_new_user (trigger function with SECURITY DEFINER)
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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix: reset_monthly_usage (cron function)
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
    UPDATE trainers
    SET plans_used_this_month = 0,
        billing_cycle_start = NOW()
    WHERE billing_cycle_start < NOW() - INTERVAL '1 month'
       OR billing_cycle_start IS NULL;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Fix: increment_plan_usage (usage tracking)
CREATE OR REPLACE FUNCTION increment_plan_usage(trainer_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE trainers
    SET plans_used_this_month = plans_used_this_month + 1,
        updated_at = NOW()
    WHERE id = trainer_uuid;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Fix: increment_plan_attempts (plan generation tracking)
CREATE OR REPLACE FUNCTION increment_plan_attempts(plan_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE plans
    SET attempts = attempts + 1,
        updated_at = NOW()
    WHERE id = plan_uuid;
END;
$$ LANGUAGE plpgsql
SET search_path = public;
