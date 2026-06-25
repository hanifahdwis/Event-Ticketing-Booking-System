import { Event } from '../../../src/domain/event/aggregates/event.aggregate';
import { EventCreatedDomainEvent } from '../../../src/domain/event/domain-events/event-created.domain-event';
import { EventPublishedDomainEvent } from '../../../src/domain/event/domain-events/event-published.domain-event';
import { EventCancelledDomainEvent } from '../../../src/domain/event/domain-events/event-cancelled.domain-event';
import { TicketCategoryCreatedDomainEvent } from '../../../src/domain/event/domain-events/ticket-category-created.domain-event';
import { TicketCategoryDisabledDomainEvent } from '../../../src/domain/event/domain-events/ticket-category-disabled.domain-event';
import { EventStatus } from '../../../src/domain/event/value-objects/event-status.vo';
import { TicketCategoryId } from '../../../src/domain/event/value-objects/ticket-category-id.vo';

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
  price: 150_000,
  quota: 100,
  salesPeriod: {
    startDate: new Date(),
    endDate: dayAfter(eventStartDate, -1),
  },
});

const buildPublishedEvent = () => {
  const props = makeValidCreateProps();
  const event = Event.create(props);
  event.addTicketCategory(makeValidTicketCategoryProps(props.schedule.startDate));
  event.publish();
  event.clearDomainEvents();
  return { event, props };
};

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

describe('US 2 – Publish Event', () => {
  const buildDraftEventWithCategory = () => {
    const props = makeValidCreateProps();
    const event = Event.create(props);
    event.addTicketCategory(makeValidTicketCategoryProps(props.schedule.startDate));
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
      price: 100_000,
      quota: 50,
      salesPeriod: {
        startDate: new Date(),
        endDate: dayAfter(props.schedule.startDate, -1),
      },
    });
    expect(() =>
      event.addTicketCategory({
        name: 'VIP',
        price: 300_000,
        quota: 10,
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

describe('US 3 – Cancel Event', () => {
  it('should cancel a Published event and change status to Cancelled', () => {
    const { event } = buildPublishedEvent();
    event.cancel();
    expect(event.status.isCancelled()).toBe(true);
  });

  it('should raise exactly one EventCancelled domain event', () => {
    const { event } = buildPublishedEvent();
    event.cancel();
    expect(event.domainEvents).toHaveLength(1);
    expect(event.domainEvents[0]).toBeInstanceOf(EventCancelledDomainEvent);
  });

  it('should disable all active ticket categories when event is cancelled', () => {
    const props = makeValidCreateProps();
    const event = Event.create(props);
    event.addTicketCategory(makeValidTicketCategoryProps(props.schedule.startDate));
    event.addTicketCategory({
      name: 'VIP',
      price: 300_000,
      quota: 50,
      salesPeriod: {
        startDate: new Date(),
        endDate: dayAfter(props.schedule.startDate, -1),
      },
    });
    event.publish();
    event.clearDomainEvents();

    event.cancel();

    for (const tc of event.ticketCategories) {
      expect(tc.isActive).toBe(false);
    }
  });

  it('should throw when cancelling a Completed event', () => {
    const props = makeValidCreateProps();
    const event = Event.create(props);
    const completedEvent = Event.reconstitute(
      event.id,
      event.organizerId,
      event.name,
      event.description,
      event.schedule,
      event.location,
      event.maxCapacity,
      EventStatus.completed(),
      [],
    );
    expect(() => completedEvent.cancel()).toThrow(
      'A Completed event cannot be cancelled',
    );
  });

  it('should throw when cancelling a Draft event', () => {
    const event = Event.create(makeValidCreateProps());
    expect(() => event.cancel()).toThrow('Only a Published event can be cancelled');
  });

  it('should throw when cancelling an already Cancelled event', () => {
    const { event } = buildPublishedEvent();
    event.cancel();
    expect(() => event.cancel()).toThrow('Only a Published event can be cancelled');
  });
});

describe('US 4 – Create Ticket Category', () => {
  const buildEvent = () => {
    const props = makeValidCreateProps();
    const event = Event.create(props);
    event.clearDomainEvents();
    return { event, props };
  };

  it('should add a ticket category to the event', () => {
    const { event, props } = buildEvent();
    event.addTicketCategory(makeValidTicketCategoryProps(props.schedule.startDate));
    expect(event.ticketCategories).toHaveLength(1);
  });

  it('should raise TicketCategoryCreated domain event', () => {
    const { event, props } = buildEvent();
    event.addTicketCategory(makeValidTicketCategoryProps(props.schedule.startDate));
    expect(event.domainEvents).toHaveLength(1);
    expect(event.domainEvents[0]).toBeInstanceOf(TicketCategoryCreatedDomainEvent);
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
        price: 100_000,
        quota: 100,
        salesPeriod: {
          startDate: new Date(),
          endDate: dayAfter(props.schedule.startDate, 5),
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
      price: 100_000,
      quota: 70,
      salesPeriod: {
        startDate: new Date(),
        endDate: dayAfter(props.schedule.startDate, -1),
      },
    });
    expect(() =>
      event.addTicketCategory({
        name: 'VIP',
        price: 300_000,
        quota: 50,
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

describe('US 5 – Disable Ticket Category', () => {
  it('should disable an active ticket category', () => {
    const props = makeValidCreateProps();
    const event = Event.create(props);
    const tc = event.addTicketCategory(
      makeValidTicketCategoryProps(props.schedule.startDate),
    );
    event.clearDomainEvents();

    event.disableTicketCategory(tc.id);

    expect(tc.isActive).toBe(false);
  });

  it('should raise exactly one TicketCategoryDisabled domain event', () => {
    const props = makeValidCreateProps();
    const event = Event.create(props);
    const tc = event.addTicketCategory(
      makeValidTicketCategoryProps(props.schedule.startDate),
    );
    event.clearDomainEvents();

    event.disableTicketCategory(tc.id);

    expect(event.domainEvents).toHaveLength(1);
    expect(event.domainEvents[0]).toBeInstanceOf(TicketCategoryDisabledDomainEvent);
  });

  it('should preserve the ticket category in the list after disabling', () => {
    const props = makeValidCreateProps();
    const event = Event.create(props);
    const tc = event.addTicketCategory(
      makeValidTicketCategoryProps(props.schedule.startDate),
    );

    event.disableTicketCategory(tc.id);

    const found = event.ticketCategories.find((t) => t.id.equals(tc.id));
    expect(found).toBeDefined();
    expect(found!.isActive).toBe(false);
  });

  it('should throw when ticket category id is not found', () => {
    const { event } = buildPublishedEvent();
    const fakeId = new TicketCategoryId();
    expect(() => event.disableTicketCategory(fakeId)).toThrow(
      'Ticket category not found',
    );
  });

  it('should throw when trying to disable an already-inactive ticket category', () => {
    const props = makeValidCreateProps();
    const event = Event.create(props);
    const tc = event.addTicketCategory(
      makeValidTicketCategoryProps(props.schedule.startDate),
    );
    event.disableTicketCategory(tc.id);

    expect(() => event.disableTicketCategory(tc.id)).toThrow(
      'Ticket category is already inactive',
    );
  });

  it('should throw when event is Completed', () => {
    const props = makeValidCreateProps();
    const event = Event.create(props);
    const tc = event.addTicketCategory(
      makeValidTicketCategoryProps(props.schedule.startDate),
    );
    const completedEvent = Event.reconstitute(
      event.id,
      event.organizerId,
      event.name,
      event.description,
      event.schedule,
      event.location,
      event.maxCapacity,
      EventStatus.completed(),
      [...event.ticketCategories],
    );

    expect(() => completedEvent.disableTicketCategory(tc.id)).toThrow(
      'Cannot disable a ticket category for a Completed event',
    );
  });

  it('should be possible to disable a ticket category on a Published event', () => {
    const { event } = buildPublishedEvent();
    const tc = event.ticketCategories[0];
    expect(() => event.disableTicketCategory(tc.id)).not.toThrow();
    expect(tc.isActive).toBe(false);
  });
});