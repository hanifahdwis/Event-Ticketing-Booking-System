CREATE TABLE IF NOT EXISTS bookings (
    id                  UUID         PRIMARY KEY,
    customer_id         VARCHAR(255) NOT NULL,
    customer_name       VARCHAR(255) NOT NULL DEFAULT '',
    event_id            UUID         NOT NULL REFERENCES events(id),
    ticket_category_id  UUID         NOT NULL REFERENCES ticket_categories(id),
    quantity            INTEGER      NOT NULL CHECK (quantity > 0),
    total_price_amount  NUMERIC(15,2) NOT NULL CHECK (total_price_amount >= 0),
    total_price_currency VARCHAR(10)  NOT NULL DEFAULT 'IDR',
    status              VARCHAR(50)  NOT NULL DEFAULT 'PendingPayment',
    payment_deadline    TIMESTAMPTZ  NOT NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT bookings_status_check
        CHECK (status IN ('PendingPayment', 'Paid', 'Expired', 'Refunded'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_customer      ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event         ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status        ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_event ON bookings(customer_id, event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_deadline_status
    ON bookings(payment_deadline, status)
    WHERE status = 'PendingPayment';
    