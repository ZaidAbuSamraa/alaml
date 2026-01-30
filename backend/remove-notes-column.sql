-- Remove notes column from cashflow_days table
-- Run this in pgAdmin or any PostgreSQL client connected to 'alaml' database

ALTER TABLE cashflow_days DROP COLUMN IF EXISTS notes;

-- Verify column was removed
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cashflow_days' 
ORDER BY ordinal_position;
