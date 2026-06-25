CREATE TABLE IF NOT EXISTS tickets (
    id                  UUID PRIMARY KEY,
    booking_id          UUID         NOT NULL REFERENCES bookings(id),
    customer_id         VARCHAR(255) NOT NULL,
    event_id            UUID         NOT NULL REFERENCES events(id),
    ticket_category_id  UUID         NOT NULL REFERENCES ticket_categories(id),
    ticket_code         VARCHAR(50)  NOT NULL UNIQUE,
    status              VARCHAR(50)  NOT NULL DEFAULT 'Active',
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT tickets_status_check
        CHECK (status IN ('Active', 'CheckedIn', 'Cancelled', 'RefundRequired'))
);

CREATE INDEX IF NOT EXISTS idx_tickets_booking_id      ON tickets(booking_id);
CREATE INDEX IF NOT EXISTS idx_tickets_customer_id     ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id        ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code     ON tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_tickets_status          ON tickets(status);