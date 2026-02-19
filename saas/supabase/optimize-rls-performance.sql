-- Optimize RLS policies for scale performance
-- Wraps auth.uid() in subqueries to cache evaluation instead of per-row
-- Critical for performance with thousands of users

-- Drop existing policies
DROP POLICY IF EXISTS "Trainers can view own profile" ON trainers;
DROP POLICY IF EXISTS "Trainers can update own profile" ON trainers;
DROP POLICY IF EXISTS "Trainers can view own branding" ON branding;
DROP POLICY IF EXISTS "Trainers can insert own branding" ON branding;
DROP POLICY IF EXISTS "Trainers can update own branding" ON branding;
DROP POLICY IF EXISTS "Trainers can view own clients" ON clients;
DROP POLICY IF EXISTS "Trainers can insert own clients" ON clients;
DROP POLICY IF EXISTS "Trainers can update own clients" ON clients;
DROP POLICY IF EXISTS "Trainers can delete own clients" ON clients;
DROP POLICY IF EXISTS "Trainers can view own plans" ON plans;
DROP POLICY IF EXISTS "Trainers can insert own plans" ON plans;

-- Recreate with optimized auth.uid() calls
-- trainers table
CREATE POLICY "Trainers can view own profile" ON trainers
    FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "Trainers can update own profile" ON trainers
    FOR UPDATE USING ((select auth.uid()) = id);

-- branding table
CREATE POLICY "Trainers can view own branding" ON branding
    FOR SELECT USING ((select auth.uid()) = trainer_id);

CREATE POLICY "Trainers can insert own branding" ON branding
    FOR INSERT WITH CHECK ((select auth.uid()) = trainer_id);

CREATE POLICY "Trainers can update own branding" ON branding
    FOR UPDATE USING ((select auth.uid()) = trainer_id);

-- clients table
CREATE POLICY "Trainers can view own clients" ON clients
    FOR SELECT USING ((select auth.uid()) = trainer_id);

CREATE POLICY "Trainers can insert own clients" ON clients
    FOR INSERT WITH CHECK ((select auth.uid()) = trainer_id);

CREATE POLICY "Trainers can update own clients" ON clients
    FOR UPDATE USING ((select auth.uid()) = trainer_id);

CREATE POLICY "Trainers can delete own clients" ON clients
    FOR DELETE USING ((select auth.uid()) = trainer_id);

-- plans table
CREATE POLICY "Trainers can view own plans" ON plans
    FOR SELECT USING ((select auth.uid()) = trainer_id);

CREATE POLICY "Trainers can insert own plans" ON plans
    FOR INSERT WITH CHECK ((select auth.uid()) = trainer_id);
