import { TicketId } from '../value-objects/ticket-id.vo';
import { TicketCode } from '../value-objects/ticket-code.vo';
import { EventId } from '../../event/value-objects/event-id.vo';

export class TicketCheckedInDomainEvent {
  readonly occurredAt: Date;

  constructor(
    readonly ticketId: TicketId,
    readonly ticketCode: TicketCode,
    readonly eventId: EventId,
    readonly customerId: string,
    readonly checkedInAt: Date,
  ) {
    this.occurredAt = new Date();
  }

  get eventName(): string {
    return 'TicketCheckedIn';
  }
}