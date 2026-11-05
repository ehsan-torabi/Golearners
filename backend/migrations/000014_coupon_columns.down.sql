-- 000014_coupon_columns.down.sql

ALTER TABLE coupons
    DROP COLUMN IF EXISTS discount_cap_rial,
    DROP COLUMN IF EXISTS first_purchase_only,
    DROP COLUMN IF EXISTS applies_to_sale_items;
