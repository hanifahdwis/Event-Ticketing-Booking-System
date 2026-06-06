import { TicketId } from '../value-objects/ticket-id.vo';
import { TicketCode } from '../value-objects/ticket-code.vo';
import { TicketStatus } from '../value-objects/ticket-status.vo';
import { TicketCheckedInDomainEvent } from '../domain-events/ticket-checked-in.domain-event';
import { EventId } from '../../event/value-objects/event-id.vo';
import { TicketCategoryId } from '../../event/value-objects/ticket-category-id.vo';
import { BookingId } from '../../booking/value-objects/booking-id.vo';

export interface CreateTicketProps {
  bookingId: BookingId;
  customerId: string;
  eventId: EventId;
  ticketCategoryId: TicketCategoryId;
}

export interface CheckInProps {
  /** The event ID that the gate officer is checking in for */
  checkedInForEventId: EventId;
  /** Whether the event is currently cancelled */
  eventIsCancelled: boolean;
  /** Whether today is within the allowed check-in time window */
  isWithinCheckInWindow: boolean;
  checkedInAt?: Date;
}

export class Ticket {
  private _id: TicketId;
  private _bookingId: BookingId;
  private _customerId: string;
  private _eventId: EventId;
  private _ticketCategoryId: TicketCategoryId;
  private _code: TicketCode;
  private _status: TicketStatus;
  private _domainEvents: object[];

  private constructor() {
    this._domainEvents = [];
  }

  // ── Factory: called after BookingPaid ──────────────────────────────────────

  static issue(props: CreateTicketProps): Ticket {
    const ticket = new Ticket();
    ticket._id = new TicketId();
    ticket._bookingId = props.bookingId;
    ticket._customerId = props.customerId;
    ticket._eventId = props.eventId;
    ticket._ticketCategoryId = props.ticketCategoryId;
    ticket._code = new TicketCode();         // unique code generated here
    ticket._status = TicketStatus.active();
    return ticket;
  }

  static reconstitute(
    id: TicketId,
    bookingId: BookingId,
    customerId: string,
    eventId: EventId,
    ticketCategoryId: TicketCategoryId,
    code: TicketCode,
    status: TicketStatus,
  ): Ticket {
    const ticket = new Ticket();
    ticket._id = id;
    ticket._bookingId = bookingId;
    ticket._customerId = customerId;
    ticket._eventId = eventId;
    ticket._ticketCategoryId = ticketCategoryId;
    ticket._code = code;
    ticket._status = status;
    return ticket;
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  get id(): TicketId { return this._id; }
  get bookingId(): BookingId { return this._bookingId; }
  get customerId(): string { return this._customerId; }
  get eventId(): EventId { return this._eventId; }
  get ticketCategoryId(): TicketCategoryId { return this._ticketCategoryId; }
  get code(): TicketCode { return this._code; }
  get status(): TicketStatus { return this._status; }
  get domainEvents(): object[] { return [...this._domainEvents]; }

  // ── US 13: Check In Ticket ─────────────────────────────────────────────────

  checkIn(props: CheckInProps): void {
    const checkedInAt = props.checkedInAt ?? new Date();

    // US 14: reject if event is cancelled
    if (props.eventIsCancelled) {
      throw new Error('The event has been cancelled');
    }

    // US 14: reject if ticket belongs to a different event
    if (!this._eventId.equals(props.checkedInForEventId)) {
      throw new Error('The ticket does not match the event');
    }

    // US 14: reject if ticket has already been checked in
    if (this._status.isCheckedIn()) {
      throw new Error('The ticket has already been used');
    }

    // US 13: ticket must be Active
    if (!this._status.isActive()) {
      throw new Error('Check-in can only be performed for a ticket with status Active');
    }

    // US 13: check-in only allowed within the allowed time window
    if (!props.isWithinCheckInWindow) {
      throw new Error(
        'Check-in can only be performed on the event day or within the allowed check-in time window',
      );
    }

    this._status = TicketStatus.checkedIn();

    this._domainEvents.push(
      new TicketCheckedInDomainEvent(
        this._id,
        this._code,
        this._eventId,
        this._customerId,
        checkedInAt,
      ),
    );
  }

  // ── Cancel (used by Refund approval / Event cancellation) ─────────────────

  cancel(): void {
    if (this._status.isCheckedIn()) {
      throw new Error('A checked-in ticket cannot be cancelled');
    }
    this._status = TicketStatus.cancelled();
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}