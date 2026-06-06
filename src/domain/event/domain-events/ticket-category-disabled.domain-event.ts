import { EventId } from '../value-objects/event-id.vo';
import { TicketCategoryId } from '../value-objects/ticket-category-id.vo';

export class TicketCategoryDisabledDomainEvent {
  readonly occurredAt: Date;

  constructor(
    readonly eventId: EventId,
    readonly ticketCategoryId: TicketCategoryId,
  ) {
    this.occurredAt = new Date();
  }

  get eventName(): string {
    return 'TicketCategoryDisabled';
  }
}