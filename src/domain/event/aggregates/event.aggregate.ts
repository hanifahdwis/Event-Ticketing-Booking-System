import { Money } from '../../shared/value-objects/money.vo';
import { EventCreatedDomainEvent } from '../domain-events/event-created.domain-event';
import { EventPublishedDomainEvent } from '../domain-events/event-published.domain-event';
import { TicketCategoryCreatedDomainEvent } from '../domain-events/ticket-category-created.domain-event';
import { TicketCategory } from '../entities/ticket-category.entity';
import { Capacity } from '../value-objects/capacity.vo';
import { EventId } from '../value-objects/event-id.vo';
import { EventName } from '../value-objects/event-name.vo';
import { EventSchedule } from '../value-objects/event-schedule.vo';
import { EventStatus } from '../value-objects/event-status.vo';
import { Location } from '../value-objects/location.vo';
import { Quota } from '../value-objects/quota.vo';
import { SalesPeriod } from '../value-objects/sales-period.vo';
import { TicketCategoryId } from '../value-objects/ticket-category-id.vo';
import { TicketCategoryName } from '../value-objects/ticket-category-name.vo';

export interface CreateEventProps {
  organizerId: string;
  name: string;
  description: string;
  schedule: { startDate: Date; endDate: Date };
  location: { address: string; city: string };
  maxCapacity: number;
}

export interface AddTicketCategoryProps {
  name: string;
  price: number;
  currency?: string;
  quota: number;
  salesPeriod: { startDate: Date; endDate: Date };
}

export class Event {
  private _id: EventId;
  private _organizerId: string;
  private _name: EventName;
  private _description: string;
  private _schedule: EventSchedule;
  private _location: Location;
  private _maxCapacity: Capacity;
  private _status: EventStatus;
  private _ticketCategories: TicketCategory[];
  private _domainEvents: object[];

  private constructor() {
    this._ticketCategories = [];
    this._domainEvents = [];
  }


  static create(props: CreateEventProps): Event {
    const event = new Event();
    event._id = new EventId();
    event._organizerId = props.organizerId;
    event._name = new EventName(props.name);
    event._description = props.description;
    event._schedule = new EventSchedule(
      props.schedule.startDate,
      props.schedule.endDate,
    );
    event._location = new Location(
      props.location.address,
      props.location.city,
    );
    event._maxCapacity = new Capacity(props.maxCapacity);
    event._status = EventStatus.draft();

    event._domainEvents.push(
      new EventCreatedDomainEvent(
        event._id,
        props.organizerId,
        props.name,
      ),
    );

    return event;
  }

  static reconstitute(
    id: EventId,
    organizerId: string,
    name: EventName,
    description: string,
    schedule: EventSchedule,
    location: Location,
    maxCapacity: Capacity,
    status: EventStatus,
    ticketCategories: TicketCategory[],
  ): Event {
    const event = new Event();
    event._id = id;
    event._organizerId = organizerId;
    event._name = name;
    event._description = description;
    event._schedule = schedule;
    event._location = location;
    event._maxCapacity = maxCapacity;
    event._status = status;
    event._ticketCategories = ticketCategories;
    return event;
  }

  get id(): EventId {
    return this._id;
  }

  get organizerId(): string {
    return this._organizerId;
  }

  get name(): EventName {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get schedule(): EventSchedule {
    return this._schedule;
  }

  get location(): Location {
    return this._location;
  }

  get maxCapacity(): Capacity {
    return this._maxCapacity;
  }

  get status(): EventStatus {
    return this._status;
  }

  get ticketCategories(): TicketCategory[] {
    return [...this._ticketCategories];
  }

  get domainEvents(): object[] {
    return [...this._domainEvents];
  }


  publish(): void {
    if (this._status.isCancelled()) {
      throw new Error('A cancelled event cannot be published');
    }
    if (!this._status.isDraft()) {
      throw new Error('Only a Draft event can be published');
    }

    const activeCategories = this._ticketCategories.filter((tc) => tc.isActive);
    if (activeCategories.length === 0) {
      throw new Error(
        'Event cannot be published without at least one active ticket category',
      );
    }

    const totalQuota = this._ticketCategories
      .filter((tc) => tc.isActive)
      .reduce((sum, tc) => sum + tc.quota.total, 0);

    if (this._maxCapacity.isExceededBy(totalQuota)) {
      throw new Error(
        'Total ticket quota exceeds the maximum event capacity',
      );
    }

    this._status = EventStatus.published();

    this._domainEvents.push(
      new EventPublishedDomainEvent(this._id, this._organizerId),
    );
  }


  addTicketCategory(props: AddTicketCategoryProps): TicketCategory {
    const currentTotalQuota = this._ticketCategories
      .filter((tc) => tc.isActive)
      .reduce((sum, tc) => sum + tc.quota.total, 0);

    if (this._maxCapacity.isExceededBy(currentTotalQuota + props.quota)) {
      throw new Error(
        'Total quota of all ticket categories must not exceed the maximum event capacity',
      );
    }

    const salesPeriod = new SalesPeriod(
      props.salesPeriod.startDate,
      props.salesPeriod.endDate,
      this._schedule.startDate,
    );

    const ticketCategory = new TicketCategory({
      id: new TicketCategoryId(),
      name: new TicketCategoryName(props.name),
      price: new Money(props.price, props.currency ?? 'IDR'),
      quota: new Quota(props.quota),
      salesPeriod,
      isActive: true,
    });

    this._ticketCategories.push(ticketCategory);

    this._domainEvents.push(
      new TicketCategoryCreatedDomainEvent(
        this._id,
        ticketCategory.id,
        props.name,
      ),
    );

    return ticketCategory;
  }

  getLowestTicketPrice(): Money | null {
    const active = this._ticketCategories.filter((tc) => tc.isActive);
    if (active.length === 0) return null;
    return active.reduce((lowest, tc) =>
      tc.price.amount < lowest.price.amount ? tc : lowest,
    ).price;
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}