-- Drop unused trainer_stats view
-- This view was never used in the application and caused security warnings
-- Dashboard stats are fetched via direct queries instead

DROP VIEW IF EXISTS trainer_stats;
