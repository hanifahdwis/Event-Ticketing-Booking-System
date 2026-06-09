CREATE TABLE IF NOT EXISTS tickets (
    id                  UUID PRIMARY KEY,
    booking_id          UUID         NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    customer_id         VARCHAR(255) NOT NULL,
    event_id            UUID         NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_category_id  UUID         NOT NULL REFERENCES ticket_categories(id) ON DELETE CASCADE,
    ticket_code         VARCHAR(50)  NOT NULL UNIQUE,
    status              VARCHAR(50)  NOT NULL DEFAULT 'Active',
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_booking_id      ON tickets(booking_id);
CREATE INDEX IF NOT EXISTS idx_tickets_customer_id     ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id        ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code     ON tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_tickets_status          ON tickets(status);