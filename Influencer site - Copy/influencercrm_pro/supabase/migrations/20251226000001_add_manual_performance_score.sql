-- Add Manual Performance Score Field
-- Created: 2025-12-26
-- Purpose: Allow manual override of performance scores

-- Add manual_performance_score column to creators table
ALTER TABLE creators 
ADD COLUMN IF NOT EXISTS manual_performance_score DECIMAL(3,1) CHECK (manual_performance_score >= 0 AND manual_performance_score <= 10);

-- Add comment to explain the field
COMMENT ON COLUMN creators.manual_performance_score IS 'Manually set performance score (0-10). If set, this overrides the calculated score. NULL means use calculated score.';

