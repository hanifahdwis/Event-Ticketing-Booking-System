import { EventId } from '../value-objects/event-id.vo';

export class EventCreatedDomainEvent {
  readonly occurredAt: Date;

  constructor(
    readonly eventId: EventId,
    readonly organizerId: string,
    readonly eventName: string,
  ) {
    this.occurredAt = new Date();
  }

  get eventName_(): string {
    return 'EventCreated';
  }
}