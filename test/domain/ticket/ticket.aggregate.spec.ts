import { Ticket } from '../../../src/domain/ticket/aggregates/ticket.aggregate';
import { TicketStatus } from '../../../src/domain/ticket/value-objects/ticket-status.vo';
import { TicketId } from '../../../src/domain/ticket/value-objects/ticket-id.vo';
import { TicketCode } from '../../../src/domain/ticket/value-objects/ticket-code.vo';
import { TicketCheckedInDomainEvent } from '../../../src/domain/ticket/domain-events/ticket-checked-in.domain-event';
import { EventId } from '../../../src/domain/event/value-objects/event-id.vo';
import { TicketCategoryId } from '../../../src/domain/event/value-objects/ticket-category-id.vo';
import { BookingId } from '../../../src/domain/booking/value-objects/booking-id.vo';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeEventId = () => new EventId();
const makeBookingId = () => new BookingId();
const makeCategoryId = () => new TicketCategoryId();

/** Build a valid Active ticket for a given eventId */
const buildActiveTicket = (eventId: EventId) =>
  Ticket.issue({
    bookingId: makeBookingId(),
    customerId: 'customer-001',
    eventId,
    ticketCategoryId: makeCategoryId(),
  });

/** Default valid check-in props (same event, not cancelled, within window) */
const validCheckIn = (eventId: EventId) => ({
  checkedInForEventId: eventId,
  eventIsCancelled: false,
  isWithinCheckInWindow: true,
  checkedInAt: new Date(),
});

// ── US 13: Check In Ticket ─────────────────────────────────────────────────────

describe('US 13 – Check In Ticket', () => {
  it('should change ticket status to CheckedIn on valid check-in', () => {
    const eventId = makeEventId();
    const ticket = buildActiveTicket(eventId);

    ticket.checkIn(validCheckIn(eventId));

    expect(ticket.status.isCheckedIn()).toBe(true);
  });

  it('should raise exactly one TicketCheckedIn domain event', () => {
    const eventId = makeEventId();
    const ticket = buildActiveTicket(eventId);

    ticket.checkIn(validCheckIn(eventId));

    expect(ticket.domainEvents).toHaveLength(1);
    expect(ticket.domainEvents[0]).toBeInstanceOf(TicketCheckedInDomainEvent);
  });

  it('should store the correct checkedInAt time in the domain event', () => {
    const eventId = makeEventId();
    const ticket = buildActiveTicket(eventId);
    const checkedInAt = new Date('2025-12-01T09:30:00');

    ticket.checkIn({ ...validCheckIn(eventId), checkedInAt });

    const event = ticket.domainEvents[0] as TicketCheckedInDomainEvent;
    expect(event.checkedInAt).toEqual(checkedInAt);
  });

  it('should throw when check-in is outside the allowed time window', () => {
    const eventId = makeEventId();
    const ticket = buildActiveTicket(eventId);

    expect(() =>
      ticket.checkIn({ ...validCheckIn(eventId), isWithinCheckInWindow: false }),
    ).toThrow(
      'Check-in can only be performed on the event day or within the allowed check-in time window',
    );
  });

  it('should not change status if check-in fails due to wrong time window', () => {
    const eventId = makeEventId();
    const ticket = buildActiveTicket(eventId);

    try {
      ticket.checkIn({ ...validCheckIn(eventId), isWithinCheckInWindow: false });
    } catch (_) {}

    expect(ticket.status.isActive()).toBe(true);
  });
});

// ── US 14: Reject Invalid Ticket Check-in ─────────────────────────────────────

describe('US 14 – Reject Invalid Ticket Check-in', () => {
  it('should throw when ticket has already been checked in', () => {
    const eventId = makeEventId();
    const ticket = buildActiveTicket(eventId);
    ticket.checkIn(validCheckIn(eventId));

    expect(() => ticket.checkIn(validCheckIn(eventId))).toThrow(
      'The ticket has already been used',
    );
  });

  it('should throw when ticket belongs to a different event', () => {
    const correctEventId = makeEventId();
    const wrongEventId = makeEventId();
    const ticket = buildActiveTicket(correctEventId);

    expect(() =>
      ticket.checkIn({ ...validCheckIn(wrongEventId), checkedInForEventId: wrongEventId }),
    ).toThrow('The ticket does not match the event');
  });

  it('should throw when the event has been cancelled', () => {
    const eventId = makeEventId();
    const ticket = buildActiveTicket(eventId);

    expect(() =>
      ticket.checkIn({ ...validCheckIn(eventId), eventIsCancelled: true }),
    ).toThrow('The event has been cancelled');
  });

  it('should not change ticket status when check-in fails due to duplicate check-in', () => {
    const eventId = makeEventId();
    const ticket = buildActiveTicket(eventId);
    ticket.checkIn(validCheckIn(eventId));

    try {
      ticket.checkIn(validCheckIn(eventId));
    } catch (_) {}

    expect(ticket.status.isCheckedIn()).toBe(true); // unchanged
  });

  it('should not change ticket status when check-in fails due to wrong event', () => {
    const correctEventId = makeEventId();
    const wrongEventId = makeEventId();
    const ticket = buildActiveTicket(correctEventId);

    try {
      ticket.checkIn({ ...validCheckIn(wrongEventId), checkedInForEventId: wrongEventId });
    } catch (_) {}

    expect(ticket.status.isActive()).toBe(true); // unchanged
  });

  it('should not change ticket status when check-in fails due to cancelled event', () => {
    const eventId = makeEventId();
    const ticket = buildActiveTicket(eventId);

    try {
      ticket.checkIn({ ...validCheckIn(eventId), eventIsCancelled: true });
    } catch (_) {}

    expect(ticket.status.isActive()).toBe(true); // unchanged
  });

  it('should not raise any domain event when check-in fails', () => {
    const eventId = makeEventId();
    const ticket = buildActiveTicket(eventId);

    try {
      ticket.checkIn({ ...validCheckIn(eventId), eventIsCancelled: true });
    } catch (_) {}

    expect(ticket.domainEvents).toHaveLength(0);
  });
});

// ── Ticket.issue() & Ticket.reconstitute() ─────────────────────────────────────

describe('Ticket – issue() and reconstitute()', () => {
  it('should issue a ticket with status Active', () => {
    const eventId = makeEventId();
    const ticket = buildActiveTicket(eventId);
    expect(ticket.status.isActive()).toBe(true);
  });

  it('should auto-generate a unique ticket code on issue', () => {
    const eventId = makeEventId();
    const t1 = buildActiveTicket(eventId);
    const t2 = buildActiveTicket(eventId);
    expect(t1.code.value).not.toBe(t2.code.value);
  });

  it('should produce no domain events on issue', () => {
    const eventId = makeEventId();
    const ticket = buildActiveTicket(eventId);
    expect(ticket.domainEvents).toHaveLength(0);
  });

  it('should reconstitute correctly and produce no domain events', () => {
    const id = new TicketId();
    const bookingId = makeBookingId();
    const eventId = makeEventId();
    const categoryId = makeCategoryId();
    const code = new TicketCode();
    const status = TicketStatus.checkedIn();

    const ticket = Ticket.reconstitute(
      id, bookingId, 'customer-X', eventId, categoryId, code, status,
    );

    expect(ticket.id.equals(id)).toBe(true);
    expect(ticket.status.isCheckedIn()).toBe(true);
    expect(ticket.code.equals(code)).toBe(true);
    expect(ticket.domainEvents).toHaveLength(0);
  });
});

// ── Ticket.cancel() ────────────────────────────────────────────────────────────

describe('Ticket – cancel()', () => {
  it('should cancel an Active ticket', () => {
    const eventId = makeEventId();
    const ticket = buildActiveTicket(eventId);
    ticket.cancel();
    expect(ticket.status.isCancelled()).toBe(true);
  });

  it('should throw when trying to cancel a checked-in ticket', () => {
    const eventId = makeEventId();
    const ticket = buildActiveTicket(eventId);
    ticket.checkIn(validCheckIn(eventId));

    expect(() => ticket.cancel()).toThrow('A checked-in ticket cannot be cancelled');
  });
});