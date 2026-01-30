-- SQL Script to clear production data
-- Run this script to reset the database for production deployment
-- WARNING: This will delete all data from the specified tables

-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Delete all payments
DELETE FROM payments;

-- Delete all invoices
DELETE FROM invoices;

-- Delete all transactions
DELETE FROM transactions;

-- Delete all suppliers
DELETE FROM suppliers;

-- Delete all time logs
DELETE FROM time_logs;

-- Delete all resource requests
DELETE FROM resource_requests;

-- Delete all notifications
DELETE FROM notifications;

-- Delete all employees (but keep admin users)
DELETE FROM employees;

-- Reset sequences for auto-increment IDs
ALTER SEQUENCE payments_id_seq RESTART WITH 1;
ALTER SEQUENCE invoices_id_seq RESTART WITH 1;
ALTER SEQUENCE transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE suppliers_id_seq RESTART WITH 1;
ALTER SEQUENCE time_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE resource_requests_id_seq RESTART WITH 1;
ALTER SEQUENCE notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE employees_id_seq RESTART WITH 1;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Display confirmation
SELECT 'Production data cleared successfully!' as status;
