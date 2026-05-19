import { Money } from '../../shared/value-objects/money.vo';
import { EventId } from '../../event/value-objects/event-id.vo';
import { TicketCategoryId } from '../../event/value-objects/ticket-category-id.vo';
import { BookingId } from '../value-objects/booking-id.vo';
import { BookingStatus } from '../value-objects/booking-status.vo';
import { PaymentDeadline } from '../value-objects/payment-deadline.vo';
import { Quantity } from '../value-objects/quantity.vo';
import { TicketReservedDomainEvent } from '../domain-events/ticket-reserved.domain-event';
import { BookingPaidDomainEvent } from '../domain-events/booking-paid.domain-event';
import { BookingExpiredDomainEvent } from '../domain-events/booking-expired.domain-event';

export interface CreateBookingProps {
  customerId: string;
  eventId: string;
  ticketCategoryId: string;
  quantity: number;
  unitPrice: Money;
  serviceFee?: Money;
  eventIsPublished: boolean;
  ticketCategoryIsActive: boolean;
  salesPeriodIsActive: boolean;
  remainingQuota: number;
  customerHasActiveBookingForEvent: boolean;
}

export class Booking {
  private _id: BookingId;
  private _customerId: string;
  private _eventId: EventId;
  private _ticketCategoryId: TicketCategoryId;
  private _quantity: Quantity;
  private _totalPrice: Money;
  private _status: BookingStatus;
  private _paymentDeadline: PaymentDeadline;
  private _domainEvents: object[];

  private constructor() {
    this._domainEvents = [];
  }

  static create(props: CreateBookingProps): Booking {
    if (!props.eventIsPublished) {
      throw new Error(
        'A booking can only be created for a Published event',
      );
    }
    if (!props.ticketCategoryIsActive) {
      throw new Error(
        'A booking can only be created for an active ticket category',
      );
    }
    if (!props.salesPeriodIsActive) {
      throw new Error(
        'A booking can only be created within the ticket sales period',
      );
    }
    if (props.customerHasActiveBookingForEvent) {
      throw new Error(
        'A customer cannot have more than one active booking for the same event',
      );
    }

    const quantity = new Quantity(props.quantity);

    if (props.quantity > props.remainingQuota) {
      throw new Error(
        'Ticket quantity exceeds the remaining ticket quota',
      );
    }

    const booking = new Booking();
    booking._id = new BookingId();
    booking._customerId = props.customerId;
    booking._eventId = new EventId(props.eventId);
    booking._ticketCategoryId = new TicketCategoryId(props.ticketCategoryId);
    booking._quantity = quantity;
    booking._status = BookingStatus.pendingPayment();
    booking._paymentDeadline = new PaymentDeadline(); 

    let total = props.unitPrice.multiply(props.quantity);
    if (props.serviceFee) {
      total = total.add(props.serviceFee);
    }
    booking._totalPrice = total;

    booking._domainEvents.push(
      new TicketReservedDomainEvent(
        booking._id,
        props.customerId,
        booking._eventId,
        booking._ticketCategoryId,
        props.quantity,
      ),
    );

    return booking;
  }

  static reconstitute(
    id: BookingId,
    customerId: string,
    eventId: EventId,
    ticketCategoryId: TicketCategoryId,
    quantity: Quantity,
    totalPrice: Money,
    status: BookingStatus,
    paymentDeadline: PaymentDeadline,
  ): Booking {
    const booking = new Booking();
    booking._id = id;
    booking._customerId = customerId;
    booking._eventId = eventId;
    booking._ticketCategoryId = ticketCategoryId;
    booking._quantity = quantity;
    booking._totalPrice = totalPrice;
    booking._status = status;
    booking._paymentDeadline = paymentDeadline;
    return booking;
  }

  get id(): BookingId { return this._id; }
  get customerId(): string { return this._customerId; }
  get eventId(): EventId { return this._eventId; }
  get ticketCategoryId(): TicketCategoryId { return this._ticketCategoryId; }
  get quantity(): Quantity { return this._quantity; }
  get totalPrice(): Money { return this._totalPrice; }
  get status(): BookingStatus { return this._status; }
  get paymentDeadline(): PaymentDeadline { return this._paymentDeadline; }
  get domainEvents(): object[] { return [...this._domainEvents]; }

  pay(paymentAmount: Money, at: Date = new Date()): void {
    if (!this._status.isPendingPayment()) {
      throw new Error(
        'A booking can only be paid if its status is PendingPayment',
      );
    }
    if (this._paymentDeadline.isExpired(at)) {
      throw new Error(
        'A booking cannot be paid if the payment deadline has passed',
      );
    }
    if (!paymentAmount.equals(this._totalPrice)) {
      throw new Error(
        'The payment amount must be equal to the total booking price',
      );
    }

    this._status = BookingStatus.paid();

    this._domainEvents.push(
      new BookingPaidDomainEvent(
        this._id,
        this._customerId,
        this._eventId,
        this._ticketCategoryId,
        this._quantity.value,
        paymentAmount.amount,
        paymentAmount.currency,
      ),
    );
  }

  expire(): void {
    if (this._status.isPaid()) {
      throw new Error('A Paid booking cannot be marked as expired');
    }
    if (!this._status.isPendingPayment()) {
      throw new Error('Only a PendingPayment booking can be expired');
    }

    this._status = BookingStatus.expired();

    this._domainEvents.push(
      new BookingExpiredDomainEvent(
        this._id,
        this._customerId,
        this._eventId,
        this._ticketCategoryId,
        this._quantity.value, 
      ),
    );
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}