import { Event } from '../../../src/domain/event/aggregates/event.aggregate';
import { EventCreatedDomainEvent } from '../../../src/domain/event/domain-events/event-created.domain-event';
import { EventPublishedDomainEvent } from '../../../src/domain/event/domain-events/event-published.domain-event';
import { TicketCategoryCreatedDomainEvent } from '../../../src/domain/event/domain-events/ticket-category-created.domain-event';

// ── Helpers ─────────────────────────────────────────────────────────────────

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
};

const dayAfter = (base: Date, days: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

const makeValidCreateProps = () => ({
  organizerId: 'org-1',
  name: 'Tech Conference 2025',
  description: 'A great tech event',
  schedule: {
    startDate: dayAfter(new Date(), 30),
    endDate: dayAfter(new Date(), 31),
  },
  location: { address: 'Jl. Raya No. 1', city: 'Surabaya' },
  maxCapacity: 500,
});

const makeValidTicketCategoryProps = (eventStartDate: Date) => ({
  name: 'Regular',
  price: 150000,
  quota: 100,
  salesPeriod: {
    startDate: new Date(),
    endDate: dayAfter(eventStartDate, -1),
  },
});

// ── US 1: Create Event ───────────────────────────────────────────────────────

describe('US 1 – Create Event', () => {
  it('should create an event with status Draft', () => {
    const event = Event.create(makeValidCreateProps());
    expect(event.status.isDraft()).toBe(true);
  });

  it('should raise EventCreated domain event after creation', () => {
    const event = Event.create(makeValidCreateProps());
    const events = event.domainEvents;
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(EventCreatedDomainEvent);
  });

  it('should throw when end date is earlier than start date', () => {
    const props = makeValidCreateProps();
    props.schedule.endDate = dayAfter(props.schedule.startDate, -5);
    expect(() => Event.create(props)).toThrow(
      'End date cannot be earlier than start date',
    );
  });

  it('should throw when max capacity is zero', () => {
    const props = makeValidCreateProps();
    props.maxCapacity = 0;
    expect(() => Event.create(props)).toThrow(
      'Capacity must be a positive integer greater than zero',
    );
  });

  it('should throw when max capacity is negative', () => {
    const props = makeValidCreateProps();
    props.maxCapacity = -1;
    expect(() => Event.create(props)).toThrow(
      'Capacity must be a positive integer greater than zero',
    );
  });

  it('should store organizer id, name, and location correctly', () => {
    const props = makeValidCreateProps();
    const event = Event.create(props);
    expect(event.organizerId).toBe(props.organizerId);
    expect(event.name.value).toBe(props.name);
    expect(event.location.city).toBe(props.location.city);
  });
});

// ── US 2: Publish Event ───────────────────────────────────────────────────────

describe('US 2 – Publish Event', () => {
  const buildDraftEventWithCategory = () => {
    const props = makeValidCreateProps();
    const event = Event.create(props);
    event.addTicketCategory(
      makeValidTicketCategoryProps(props.schedule.startDate),
    );
    event.clearDomainEvents();
    return event;
  };

  it('should publish a Draft event that has at least one active ticket category', () => {
    const event = buildDraftEventWithCategory();
    event.publish();
    expect(event.status.isPublished()).toBe(true);
  });

  it('should raise EventPublished domain event after publishing', () => {
    const event = buildDraftEventWithCategory();
    event.publish();
    const domainEvents = event.domainEvents;
    expect(domainEvents).toHaveLength(1);
    expect(domainEvents[0]).toBeInstanceOf(EventPublishedDomainEvent);
  });

  it('should throw when publishing without any active ticket category', () => {
    const event = Event.create(makeValidCreateProps());
    expect(() => event.publish()).toThrow(
      'Event cannot be published without at least one active ticket category',
    );
  });

  it('should throw when total quota exceeds max capacity', () => {
    const props = makeValidCreateProps();
    props.maxCapacity = 50;
    const event = Event.create(props);
    event.addTicketCategory({
      name: 'Regular',
      price: 100000,
      quota: 50,
      salesPeriod: {
        startDate: new Date(),
        endDate: dayAfter(props.schedule.startDate, -1),
      },
    });
    // Add second category that pushes total over capacity
    // We disable capacity check bypass by adding exactly at boundary – then disable first
    // Instead test with a single category that exactly fills capacity and one more
    expect(() =>
      event.addTicketCategory({
        name: 'VIP',
        price: 300000,
        quota: 10, // 50 + 10 = 60 > 50
        salesPeriod: {
          startDate: new Date(),
          endDate: dayAfter(props.schedule.startDate, -1),
        },
      }),
    ).toThrow(
      'Total quota of all ticket categories must not exceed the maximum event capacity',
    );
  });

  it('should throw when publishing a Cancelled event', () => {
    const { EventStatus } = require('../../../src/domain/event/value-objects/event-status.vo');
    const props = makeValidCreateProps();
    const event = Event.create(props);
    const cancelledEvent = Event.reconstitute(
      event.id,
      event.organizerId,
      event.name,
      event.description,
      event.schedule,
      event.location,
      event.maxCapacity,
      EventStatus.cancelled(),
      [],
    );
    expect(() => cancelledEvent.publish()).toThrow(
      'A cancelled event cannot be published',
    );
  });
});

// ── US 4: Create Ticket Category ──────────────────────────────────────────────

describe('US 4 – Create Ticket Category', () => {
  const buildEvent = () => {
    const props = makeValidCreateProps();
    const event = Event.create(props);
    event.clearDomainEvents();
    return { event, props };
  };

  it('should add a ticket category to the event', () => {
    const { event, props } = buildEvent();
    event.addTicketCategory(
      makeValidTicketCategoryProps(props.schedule.startDate),
    );
    expect(event.ticketCategories).toHaveLength(1);
  });

  it('should raise TicketCategoryCreated domain event', () => {
    const { event, props } = buildEvent();
    event.addTicketCategory(
      makeValidTicketCategoryProps(props.schedule.startDate),
    );
    const domainEvents = event.domainEvents;
    expect(domainEvents).toHaveLength(1);
    expect(domainEvents[0]).toBeInstanceOf(TicketCategoryCreatedDomainEvent);
  });

  it('should throw when ticket price is negative', () => {
    const { event, props } = buildEvent();
    expect(() =>
      event.addTicketCategory({
        ...makeValidTicketCategoryProps(props.schedule.startDate),
        price: -1,
      }),
    ).toThrow('Money amount cannot be negative');
  });

  it('should throw when ticket quota is zero', () => {
    const { event, props } = buildEvent();
    expect(() =>
      event.addTicketCategory({
        ...makeValidTicketCategoryProps(props.schedule.startDate),
        quota: 0,
      }),
    ).toThrow('Quota must be a positive integer greater than zero');
  });

  it('should throw when ticket quota is negative', () => {
    const { event, props } = buildEvent();
    expect(() =>
      event.addTicketCategory({
        ...makeValidTicketCategoryProps(props.schedule.startDate),
        quota: -5,
      }),
    ).toThrow('Quota must be a positive integer greater than zero');
  });

  it('should throw when sales end date exceeds event start date', () => {
    const { event, props } = buildEvent();
    expect(() =>
      event.addTicketCategory({
        name: 'Regular',
        price: 100000,
        quota: 100,
        salesPeriod: {
          startDate: new Date(),
          endDate: dayAfter(props.schedule.startDate, 5), // after event start
        },
      }),
    ).toThrow('Sales period must end before or at the event start date');
  });

  it('should throw when total quota of all categories exceeds max capacity', () => {
    const props = makeValidCreateProps();
    props.maxCapacity = 100;
    const event = Event.create(props);
    event.clearDomainEvents();

    event.addTicketCategory({
      name: 'Regular',
      price: 100000,
      quota: 70,
      salesPeriod: {
        startDate: new Date(),
        endDate: dayAfter(props.schedule.startDate, -1),
      },
    });

    expect(() =>
      event.addTicketCategory({
        name: 'VIP',
        price: 300000,
        quota: 50, // 70 + 50 = 120 > 100
        salesPeriod: {
          startDate: new Date(),
          endDate: dayAfter(props.schedule.startDate, -1),
        },
      }),
    ).toThrow(
      'Total quota of all ticket categories must not exceed the maximum event capacity',
    );
  });

  it('should create the ticket category with active status', () => {
    const { event, props } = buildEvent();
    const tc = event.addTicketCategory(
      makeValidTicketCategoryProps(props.schedule.startDate),
    );
    expect(tc.isActive).toBe(true);
  });
});