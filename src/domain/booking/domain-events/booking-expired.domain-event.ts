import { BookingId } from '../value-objects/booking-id.vo';
import { EventId } from '../../event/value-objects/event-id.vo';
import { TicketCategoryId } from '../../event/value-objects/ticket-category-id.vo';

export class BookingExpiredDomainEvent {
  readonly occurredAt: Date;

  constructor(
    readonly bookingId: BookingId,
    readonly customerId: string,
    readonly eventId: EventId,
    readonly ticketCategoryId: TicketCategoryId,
    readonly releasedQuota: number,
  ) {
    this.occurredAt = new Date();
  }

  get eventName(): string {
    return 'BookingExpired';
  }
}