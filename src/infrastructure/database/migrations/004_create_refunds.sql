CREATE TABLE IF NOT EXISTS refunds (
    id                  UUID PRIMARY KEY,
    booking_id          VARCHAR(255) NOT NULL,
    customer_id         VARCHAR(255) NOT NULL,
    amount              NUMERIC(15,2) NOT NULL CHECK (amount >= 0),
    currency            VARCHAR(10)  NOT NULL DEFAULT 'IDR',
    status              VARCHAR(50)  NOT NULL DEFAULT 'Requested',
    rejection_reason    TEXT         NULL,
    payment_reference   VARCHAR(255) NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_booking_id   ON refunds(booking_id);
CREATE INDEX IF NOT EXISTS idx_refunds_customer_id  ON refunds(customer_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status       ON refunds(status);