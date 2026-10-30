-- 000006_commerce: coupons, orders, payments, refunds (docs/03 §3 commerce).

CREATE TYPE order_status    AS ENUM ('awaiting_payment', 'paid', 'canceled', 'expired', 'refunded');
CREATE TYPE payment_status  AS ENUM ('initiated', 'redirected', 'verified', 'failed', 'reversed');
CREATE TYPE payment_gateway AS ENUM ('zarinpal', 'digipay', 'snappay', 'mock');
CREATE TYPE refund_kind     AS ENUM ('gateway_reverse', 'manual');
CREATE TYPE refund_status   AS ENUM ('requested', 'completed', 'failed');

CREATE TABLE coupons (
    id              UUID PRIMARY KEY,
    code            TEXT NOT NULL UNIQUE,   -- normalized uppercase
    type            TEXT NOT NULL CHECK (type IN ('percent', 'fixed')),
    value           BIGINT NOT NULL CHECK (value > 0),
    max_uses        INT NULL,
    per_user_limit  INT NULL,
    min_amount_rial BIGINT NULL,
    starts_at       TIMESTAMPTZ NULL,
    ends_at         TIMESTAMPTZ NULL,
    course_scope    UUID NULL REFERENCES courses (id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE coupon_redemptions (
    id        UUID PRIMARY KEY,
    coupon_id UUID NOT NULL REFERENCES coupons (id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    order_id  UUID NOT NULL,
    used_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (coupon_id, order_id)
);
CREATE INDEX idx_redemptions_coupon_user ON coupon_redemptions (coupon_id, user_id);

CREATE TABLE orders (
    id             UUID PRIMARY KEY,
    user_id        UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status         order_status NOT NULL DEFAULT 'awaiting_payment',
    subtotal_rial  BIGINT NOT NULL,
    discount_rial  BIGINT NOT NULL DEFAULT 0,
    total_rial     BIGINT NOT NULL,
    coupon_id      UUID NULL REFERENCES coupons (id) ON DELETE SET NULL,
    expires_at     TIMESTAMPTZ NOT NULL,
    paid_at        TIMESTAMPTZ NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_user ON orders (user_id, created_at DESC);
CREATE INDEX idx_orders_open ON orders (expires_at) WHERE status = 'awaiting_payment';

CREATE TABLE order_items (
    id               UUID PRIMARY KEY,
    order_id         UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    course_id        UUID NOT NULL REFERENCES courses (id),
    title_snapshot   TEXT NOT NULL,
    unit_price_rial  BIGINT NOT NULL,
    UNIQUE (order_id, course_id)
);

CREATE TABLE payments (
    id              UUID PRIMARY KEY,
    order_id        UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    gateway         payment_gateway NOT NULL,
    gateway_ref     TEXT NULL,
    amount_rial     BIGINT NOT NULL,
    status          payment_status NOT NULL DEFAULT 'initiated',
    idempotency_key TEXT NOT NULL UNIQUE,
    card_masked     TEXT NULL,
    failure_reason  TEXT NULL,
    initiated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    verified_at     TIMESTAMPTZ NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_order ON payments (order_id);
CREATE INDEX idx_payments_stuck ON payments (initiated_at) WHERE status = 'redirected';
-- one in-flight payment per order (retry supersedes the previous attempt)
CREATE UNIQUE INDEX uq_payments_active ON payments (order_id) WHERE status IN ('initiated', 'redirected');

CREATE TABLE payment_events (
    id         UUID PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES payments (id) ON DELETE CASCADE,
    type       TEXT NOT NULL,
    payload    JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_events_payment ON payment_events (payment_id, created_at);

CREATE TABLE refunds (
    id          UUID PRIMARY KEY,
    payment_id  UUID NOT NULL REFERENCES payments (id) ON DELETE CASCADE,
    amount_rial BIGINT NOT NULL,
    kind        refund_kind NOT NULL,
    reason      TEXT NOT NULL DEFAULT '',
    status      refund_status NOT NULL DEFAULT 'requested',
    gateway_ref TEXT NULL,
    acted_by    UUID NULL REFERENCES users (id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (payment_id)
);
