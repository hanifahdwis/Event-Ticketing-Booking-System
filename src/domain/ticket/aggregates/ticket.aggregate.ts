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
  checkedInForEventId: EventId;
  eventIsCancelled: boolean;
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

  static issue(props: CreateTicketProps): Ticket {
    const ticket = new Ticket();
    ticket._id = new TicketId();
    ticket._bookingId = props.bookingId;
    ticket._customerId = props.customerId;
    ticket._eventId = props.eventId;
    ticket._ticketCategoryId = props.ticketCategoryId;
    ticket._code = new TicketCode();
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

  get id(): TicketId { return this._id; }
  get bookingId(): BookingId { return this._bookingId; }
  get customerId(): string { return this._customerId; }
  get eventId(): EventId { return this._eventId; }
  get ticketCategoryId(): TicketCategoryId { return this._ticketCategoryId; }
  get code(): TicketCode { return this._code; }
  get status(): TicketStatus { return this._status; }
  get domainEvents(): object[] { return [...this._domainEvents]; }

  checkIn(props: CheckInProps): void {
    const checkedInAt = props.checkedInAt ?? new Date();

    if (props.eventIsCancelled) {
      throw new Error('The event has been cancelled');
    }

    if (!this._eventId.equals(props.checkedInForEventId)) {
      throw new Error('The ticket does not match the event');
    }

    if (this._status.isCheckedIn()) {
      throw new Error('The ticket has already been used');
    }

    if (!this._status.isActive()) {
      throw new Error('Check-in can only be performed for a ticket with status Active');
    }

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

  cancel(): void {
    if (this._status.isCheckedIn()) {
      throw new Error('A checked-in ticket cannot be cancelled');
    }
    this._status = TicketStatus.cancelled();
  }

  markAsRefundRequired(): void {
    if (this._status.isCheckedIn()) {
      throw new Error('A checked-in ticket cannot be marked as refund required');
    }
    if (!this._status.isActive()) {
      throw new Error('Only an Active ticket can be marked as refund required');
    }
    this._status = TicketStatus.refundRequired();
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}