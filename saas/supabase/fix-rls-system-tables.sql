-- Add explicit RLS policies for service-role-only tables
-- These tables are accessed only by backend services (Inngest, API routes)
-- Users should never access them directly - policies deny all user operations

-- audit_log: service role only (for compliance/debugging)
CREATE POLICY "Service role only - no user access" ON audit_log
    FOR ALL
    USING (false);

-- webhook_events: service role only (Stripe webhook processing)
CREATE POLICY "Service role only - no user access" ON webhook_events
    FOR ALL
    USING (false);

-- Note: Service role bypasses RLS, so these tables remain accessible
-- to the backend while explicitly denying user access
