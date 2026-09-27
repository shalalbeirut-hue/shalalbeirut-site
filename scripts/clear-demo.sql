-- Removes the demo data created by scripts/seed-demo.mjs (codes *-DEMO-*, phones 96500000xxx).
--   npx wrangler d1 execute shalalbeirut-ops-preview --remote --env preview --file scripts/clear-demo.sql
-- Demo photos stay in the R2 bucket under orders/SB-DEMO-*; they are no longer linked to anything.
DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE order_id IN (SELECT id FROM orders WHERE code LIKE 'SB-DEMO-%'));
DELETE FROM warranties WHERE order_id IN (SELECT id FROM orders WHERE code LIKE 'SB-DEMO-%');
DELETE FROM invoices WHERE order_id IN (SELECT id FROM orders WHERE code LIKE 'SB-DEMO-%');
DELETE FROM surveys WHERE order_id IN (SELECT id FROM orders WHERE code LIKE 'SB-DEMO-%');
DELETE FROM followups WHERE order_id IN (SELECT id FROM orders WHERE code LIKE 'SB-DEMO-%');
DELETE FROM order_photos WHERE order_id IN (SELECT id FROM orders WHERE code LIKE 'SB-DEMO-%');
DELETE FROM notifications WHERE order_id IN (SELECT id FROM orders WHERE code LIKE 'SB-DEMO-%');
DELETE FROM activity_log WHERE entity = 'order' AND entity_id IN (SELECT id FROM orders WHERE code LIKE 'SB-DEMO-%');
DELETE FROM order_services WHERE order_id IN (SELECT id FROM orders WHERE code LIKE 'SB-DEMO-%');
DELETE FROM orders WHERE code LIKE 'SB-DEMO-%';
DELETE FROM addresses WHERE customer_id IN (SELECT id FROM customers WHERE phone LIKE '96500000%');
DELETE FROM customer_links WHERE customer_id IN (SELECT id FROM customers WHERE phone LIKE '96500000%');
DELETE FROM sessions WHERE customer_id IN (SELECT id FROM customers WHERE phone LIKE '96500000%');
DELETE FROM customers WHERE phone LIKE '96500000%';
DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE phone LIKE '96500000%');
DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE phone LIKE '96500000%');
DELETE FROM users WHERE phone LIKE '96500000%';
