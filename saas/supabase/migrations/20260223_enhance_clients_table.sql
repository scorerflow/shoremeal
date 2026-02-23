-- ============================================================
-- Migration: Enhance Clients Table for Client Management
-- Date: 2026-02-23
-- Purpose: Add phone and last_plan_date fields to support
--          proper client-centric architecture
-- ============================================================

-- Add new fields to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_plan_date TIMESTAMPTZ;

-- Backfill last_plan_date from plans table (most recent plan per client)
UPDATE clients c
SET last_plan_date = (
    SELECT MAX(created_at)
    FROM plans p
    WHERE p.client_id = c.id
)
WHERE EXISTS (
    SELECT 1
    FROM plans p
    WHERE p.client_id = c.id
);

-- Create index for sorting clients by last_plan_date
CREATE INDEX IF NOT EXISTS idx_clients_last_plan_date ON clients(trainer_id, last_plan_date DESC NULLS LAST);

-- Create index for email lookups (for future search/filter features)
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(trainer_id, email);

-- Comments for documentation
COMMENT ON COLUMN clients.phone IS 'Client phone number for contact purposes';
COMMENT ON COLUMN clients.last_plan_date IS 'Timestamp of most recent plan generated for this client (denormalized for performance)';
