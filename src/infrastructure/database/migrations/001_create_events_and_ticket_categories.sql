CREATE TABLE IF NOT EXISTS events (
    id            UUID PRIMARY KEY,
    organizer_id  VARCHAR(255) NOT NULL,
    name          VARCHAR(255) NOT NULL,
    description   TEXT         NOT NULL DEFAULT '',
    start_date    TIMESTAMPTZ  NOT NULL,
    end_date      TIMESTAMPTZ  NOT NULL,
    address       VARCHAR(500) NOT NULL,
    city          VARCHAR(255) NOT NULL,
    max_capacity  INTEGER      NOT NULL CHECK (max_capacity > 0),
    status        VARCHAR(50)  NOT NULL DEFAULT 'Draft',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_categories (
    id              UUID PRIMARY KEY,
    event_id        UUID         NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    price_amount    NUMERIC(15,2) NOT NULL CHECK (price_amount >= 0),
    price_currency  VARCHAR(10)  NOT NULL DEFAULT 'IDR',
    quota_total     INTEGER      NOT NULL CHECK (quota_total > 0),
    quota_remaining INTEGER      NOT NULL CHECK (quota_remaining >= 0),
    sales_start_date TIMESTAMPTZ NOT NULL,
    sales_end_date   TIMESTAMPTZ NOT NULL,
    is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT quota_remaining_not_exceed_total CHECK (quota_remaining <= quota_total)
);

CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_ticket_categories_event ON ticket_categories(event_id);