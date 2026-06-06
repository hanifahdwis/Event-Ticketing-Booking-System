import { EventId } from '../value-objects/event-id.vo';

export class EventCancelledDomainEvent {
  readonly occurredAt: Date;

  constructor(
    readonly eventId: EventId,
    readonly organizerId: string,
  ) {
    this.occurredAt = new Date();
  }

  get eventName(): string {
    return 'EventCancelled';
  }
}