import { EventId } from '../value-objects/event-id.vo';

export class EventCreatedDomainEvent {
  readonly occurredAt: Date;
  readonly name: string;

  constructor(
    readonly eventId: EventId,
    readonly organizerId: string,
    eventName: string,
  ) {
    this.name = eventName;
    this.occurredAt = new Date();
  }

  get eventName(): string {
    return 'EventCreated';
  }
}