import { Booking, CreateBookingProps } from '../../../src/domain/booking/aggregates/booking.aggregate';
import { BookingStatus } from '../../../src/domain/booking/value-objects/booking-status.vo';
import { PaymentDeadline } from '../../../src/domain/booking/value-objects/payment-deadline.vo';
import { Quantity } from '../../../src/domain/booking/value-objects/quantity.vo';
import { BookingId } from '../../../src/domain/booking/value-objects/booking-id.vo';
import { TicketReservedDomainEvent } from '../../../src/domain/booking/domain-events/ticket-reserved.domain-event';
import { BookingPaidDomainEvent } from '../../../src/domain/booking/domain-events/booking-paid.domain-event';
import { BookingExpiredDomainEvent } from '../../../src/domain/booking/domain-events/booking-expired.domain-event';
import { BookingPricingDomainService } from '../../../src/domain/booking/services/booking-pricing.domain-service';
import { Money } from '../../../src/domain/shared/value-objects/money.vo';
import { EventId } from '../../../src/domain/event/value-objects/event-id.vo';
import { TicketCategoryId } from '../../../src/domain/event/value-objects/ticket-category-id.vo';

const UNIT_PRICE = new Money(150_000, 'IDR');
const SERVICE_FEE = new Money(5_000, 'IDR');

function makeValidProps(overrides: Partial<CreateBookingProps> = {}): CreateBookingProps {
  return {
    customerId: 'customer-001',
    eventId: 'event-001',
    ticketCategoryId: 'cat-001',
    quantity: 2,
    unitPrice: UNIT_PRICE,
    eventIsPublished: true,
    ticketCategoryIsActive: true,
    salesPeriodIsActive: true,
    remainingQuota: 100,
    customerHasActiveBookingForEvent: false,
    ...overrides,
  };
}

function makePaidBooking(): Booking {
  const booking = Booking.create(makeValidProps());
  const beforeDeadline = new Date();
  beforeDeadline.setMinutes(beforeDeadline.getMinutes() + 5);
  booking.pay(new Money(300_000, 'IDR'), beforeDeadline);
  return booking;
}

describe('US 8 – Create Ticket Booking', () => {

  it('should create a booking with status PendingPayment', () => {
    const booking = Booking.create(makeValidProps());
    expect(booking.status.isPendingPayment()).toBe(true);
  });

  it('should assign a payment deadline of ~15 minutes from now', () => {
    const before = new Date();
    const booking = Booking.create(makeValidProps());
    const after = new Date();

    const deadlineMs = booking.paymentDeadline.value.getTime();
    expect(deadlineMs).toBeGreaterThanOrEqual(before.getTime() + 14 * 60 * 1000);
    expect(deadlineMs).toBeLessThanOrEqual(after.getTime() + 15 * 60 * 1000 + 1000);
  });

  it('should raise exactly one TicketReserved domain event', () => {
    const booking = Booking.create(makeValidProps());
    const events = booking.domainEvents;
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(TicketReservedDomainEvent);
  });

  it('should store the correct quantity on the booking', () => {
    const booking = Booking.create(makeValidProps({ quantity: 3 }));
    expect(booking.quantity.value).toBe(3);
  });

  it('should throw when event is not Published', () => {
    expect(() =>
      Booking.create(makeValidProps({ eventIsPublished: false })),
    ).toThrow('A booking can only be created for a Published event');
  });

  it('should throw when ticket category is not active', () => {
    expect(() =>
      Booking.create(makeValidProps({ ticketCategoryIsActive: false })),
    ).toThrow('A booking can only be created for an active ticket category');
  });

  it('should throw when outside the sales period', () => {
    expect(() =>
      Booking.create(makeValidProps({ salesPeriodIsActive: false })),
    ).toThrow('A booking can only be created within the ticket sales period');
  });

  it('should throw when quantity is zero', () => {
    expect(() =>
      Booking.create(makeValidProps({ quantity: 0 })),
    ).toThrow('Quantity must be a positive integer greater than zero');
  });

  it('should throw when quantity is negative', () => {
    expect(() =>
      Booking.create(makeValidProps({ quantity: -3 })),
    ).toThrow('Quantity must be a positive integer greater than zero');
  });

  it('should throw when quantity exceeds remaining quota', () => {
    expect(() =>
      Booking.create(makeValidProps({ quantity: 10, remainingQuota: 5 })),
    ).toThrow('Ticket quantity exceeds the remaining ticket quota');
  });

  it('should succeed when quantity equals remaining quota exactly', () => {
    const booking = Booking.create(
      makeValidProps({ quantity: 5, remainingQuota: 5 }),
    );
    expect(booking.quantity.value).toBe(5);
  });

  it('should throw when customer already has an active booking for the event', () => {
    expect(() =>
      Booking.create(
        makeValidProps({ customerHasActiveBookingForEvent: true }),
      ),
    ).toThrow(
      'A customer cannot have more than one active booking for the same event',
    );
  });
});

describe('US 9 – Calculate Booking Total Price (BookingPricingDomainService)', () => {
  const svc = new BookingPricingDomainService();

  it('should calculate total as unitPrice × quantity', () => {
    const total = svc.calculateTotal(
      new Money(100_000, 'IDR'),
      new Quantity(3),
    );
    expect(total.amount).toBe(300_000);
    expect(total.currency).toBe('IDR');
  });

  it('should add service fee to the subtotal', () => {
    const total = svc.calculateTotal(
      new Money(100_000, 'IDR'),
      new Quantity(2),
      new Money(10_000, 'IDR'),
    );
    expect(total.amount).toBe(210_000);
  });

  it('should return zero total when unit price is zero and no fee', () => {
    const total = svc.calculateTotal(new Money(0, 'IDR'), new Quantity(5));
    expect(total.amount).toBe(0);
  });

  it('should throw on currency mismatch between price and service fee', () => {
    expect(() =>
      svc.calculateTotal(
        new Money(100_000, 'IDR'),
        new Quantity(1),
        new Money(5_000, 'USD'), 
      ),
    ).toThrow('Currency mismatch');
  });

  it('should calculate inline total (no fee) on booking creation', () => {
    const booking = Booking.create(
      makeValidProps({ quantity: 2, unitPrice: new Money(150_000, 'IDR') }),
    );
    expect(booking.totalPrice.amount).toBe(300_000);
  });

  it('should calculate inline total with service fee on booking creation', () => {
    const booking = Booking.create(
      makeValidProps({
        quantity: 2,
        unitPrice: new Money(150_000, 'IDR'),
        serviceFee: new Money(5_000, 'IDR'),
      }),
    );
    expect(booking.totalPrice.amount).toBe(305_000);
  });
});

describe('US 10 – Pay Booking', () => {

  it('should transition status to Paid on correct payment', () => {
    const booking = Booking.create(makeValidProps({ quantity: 2 }));
    booking.clearDomainEvents();
    booking.pay(new Money(300_000, 'IDR'));
    expect(booking.status.isPaid()).toBe(true);
  });

  it('should raise exactly one BookingPaid domain event', () => {
    const booking = Booking.create(makeValidProps({ quantity: 2 }));
    booking.clearDomainEvents();
    booking.pay(new Money(300_000, 'IDR'));
    const events = booking.domainEvents;
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(BookingPaidDomainEvent);
  });

  it('should include correct quantity in BookingPaid event', () => {
    const booking = Booking.create(makeValidProps({ quantity: 3 }));
    booking.clearDomainEvents();
    booking.pay(new Money(450_000, 'IDR')); // 3 × 150,000
    const event = booking.domainEvents[0] as BookingPaidDomainEvent;
    expect(event.quantity).toBe(3);
  });

  it('should throw when trying to pay an already Paid booking', () => {
    const booking = makePaidBooking();
    expect(() => booking.pay(new Money(300_000, 'IDR'))).toThrow(
      'A booking can only be paid if its status is PendingPayment',
    );
  });

  it('should throw when trying to pay an Expired booking', () => {
    const booking = Booking.create(makeValidProps({ quantity: 2 }));
    booking.expire();
    expect(() => booking.pay(new Money(300_000, 'IDR'))).toThrow(
      'A booking can only be paid if its status is PendingPayment',
    );
  });

  it('should throw when payment deadline has already passed', () => {
    const booking = Booking.create(makeValidProps({ quantity: 2 }));
    const afterDeadline = new Date();
    afterDeadline.setMinutes(afterDeadline.getMinutes() + 20);

    expect(() =>
      booking.pay(new Money(300_000, 'IDR'), afterDeadline),
    ).toThrow('A booking cannot be paid if the payment deadline has passed');
  });

  it('should throw when payment amount is less than total price', () => {
    const booking = Booking.create(makeValidProps({ quantity: 2 }));
    expect(() => booking.pay(new Money(200_000, 'IDR'))).toThrow(
      'The payment amount must be equal to the total booking price',
    );
  });

  it('should throw when payment amount is more than total price', () => {
    const booking = Booking.create(makeValidProps({ quantity: 2 }));
    expect(() => booking.pay(new Money(350_000, 'IDR'))).toThrow(
      'The payment amount must be equal to the total booking price',
    );
  });

  it('should throw when payment currency does not match', () => {
    const booking = Booking.create(
      makeValidProps({ quantity: 2, unitPrice: new Money(150_000, 'IDR') }),
    );
    expect(() => booking.pay(new Money(300_000, 'USD'))).toThrow(
      'The payment amount must be equal to the total booking price',
    );
  });
});

describe('US 11 – Expire Booking', () => {

  it('should transition status to Expired', () => {
    const booking = Booking.create(makeValidProps());
    booking.expire();
    expect(booking.status.isExpired()).toBe(true);
  });

  it('should raise exactly one BookingExpired domain event', () => {
    const booking = Booking.create(makeValidProps({ quantity: 2 }));
    booking.clearDomainEvents();
    booking.expire();
    const events = booking.domainEvents;
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(BookingExpiredDomainEvent);
  });

  it('should carry the correct released quota in the BookingExpired event', () => {
    const booking = Booking.create(makeValidProps({ quantity: 3 }));
    booking.clearDomainEvents();
    booking.expire();
    const event = booking.domainEvents[0] as BookingExpiredDomainEvent;
    expect(event.releasedQuota).toBe(3);
  });

  it('should throw when trying to expire a Paid booking', () => {
    const booking = makePaidBooking();
    expect(() => booking.expire()).toThrow(
      'A Paid booking cannot be marked as expired',
    );
  });

  it('should throw when trying to expire an already-expired booking', () => {
    const booking = Booking.create(makeValidProps());
    booking.expire();
    expect(() => booking.expire()).toThrow(
      'Only a PendingPayment booking can be expired',
    );
  });

  it('should confirm deadline is NOT expired immediately after booking creation', () => {
    const booking = Booking.create(makeValidProps());
    expect(booking.paymentDeadline.isExpired(new Date())).toBe(false);
  });

  it('should confirm deadline IS expired when 20 minutes have passed', () => {
    const booking = Booking.create(makeValidProps());
    const twentyMinsLater = new Date();
    twentyMinsLater.setMinutes(twentyMinsLater.getMinutes() + 20);
    expect(booking.paymentDeadline.isExpired(twentyMinsLater)).toBe(true);
  });
});

describe('BookingStatus – isActive()', () => {
  it('should return true for PendingPayment', () => {
    expect(BookingStatus.pendingPayment().isActive()).toBe(true);
  });

  it('should return true for Paid', () => {
    expect(BookingStatus.paid().isActive()).toBe(true);
  });

  it('should return false for Expired', () => {
    expect(BookingStatus.expired().isActive()).toBe(false);
  });

  it('should return false for Refunded', () => {
    expect(BookingStatus.refunded().isActive()).toBe(false);
  });
});

describe('Booking.reconstitute()', () => {
  it('should restore all fields and produce no domain events', () => {
    const id = new BookingId();
    const eventId = new EventId();
    const catId = new TicketCategoryId();
    const qty = new Quantity(2);
    const price = new Money(300_000, 'IDR');
    const status = BookingStatus.paid();
    const deadline = new PaymentDeadline(new Date());

    const booking = Booking.reconstitute(
      id, 'customer-X', eventId, catId, qty, price, status, deadline,
    );

    expect(booking.id.equals(id)).toBe(true);
    expect(booking.status.isPaid()).toBe(true);
    expect(booking.totalPrice.amount).toBe(300_000);
    expect(booking.domainEvents).toHaveLength(0);
  });
});