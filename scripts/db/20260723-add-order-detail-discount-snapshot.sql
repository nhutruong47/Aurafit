-- Run this script before deploying a build that uses spring.jpa.hibernate.ddl-auto=validate.
-- The columns are nullable so existing order details remain valid.

ALTER TABLE rental_order_details
    ADD COLUMN IF NOT EXISTS discount_event_id BIGINT,
    ADD COLUMN IF NOT EXISTS discount_event_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5, 2);
