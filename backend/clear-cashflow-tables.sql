-- Clear CashFlow tables to fix unique constraint issue
-- Run this script if you encounter unique constraint errors

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS cashflow_payments CASCADE;
DROP TABLE IF EXISTS cashflow_days CASCADE;
DROP TABLE IF EXISTS cashflow_settings CASCADE;

-- Tables will be recreated automatically by TypeORM synchronize
