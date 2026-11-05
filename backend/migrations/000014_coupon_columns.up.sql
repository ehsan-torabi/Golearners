-- 000014_coupon_columns: advanced coupon fields (first purchase, discount cap, sale items).

ALTER TABLE coupons
    ADD COLUMN IF NOT EXISTS discount_cap_rial BIGINT NULL,
    ADD COLUMN IF NOT EXISTS first_purchase_only BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS applies_to_sale_items BOOLEAN NOT NULL DEFAULT FALSE;
