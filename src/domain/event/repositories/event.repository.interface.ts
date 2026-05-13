import { Event } from '../aggregates/event.aggregate';
import { EventId } from '../value-objects/event-id.vo';

export interface IEventRepository {
  findById(id: EventId): Promise<Event | null>;
  save(event: Event): Promise<void>;
  findAllPublished(): Promise<Event[]>;
}

export const EVENT_REPOSITORY = Symbol('IEventRepository');