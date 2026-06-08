import { RefundId } from '../value-objects/refund-id.vo';
import { RefundStatus } from '../value-objects/refund-status.vo';
import { RejectionReason } from '../value-objects/rejection-reason.vo';
import { PaymentReference } from '../value-objects/payment-reference.vo';
import { RefundRequestedDomainEvent } from '../domain-events/refund-requested.domain-event';
import { RefundApprovedDomainEvent } from '../domain-events/refund-approved.domain-event';
import { RefundRejectedDomainEvent } from '../domain-events/refund-rejected.domain-event';
import { RefundPaidOutDomainEvent } from '../domain-events/refund-paid-out.domain-event';
import { RefundEligibilityDomainService, IBookingRef, ITicketRef, IEventRef } from '../services/refund-eligibility.domain-service';
import { Money } from '../../shared/value-objects/money.vo';

export class Refund {
  private _id: RefundId;
  private _bookingId: string;
  private _customerId: string;
  private _amount: Money;
  private _status: RefundStatus;
  private _rejectionReason?: RejectionReason;
  private _paymentReference?: PaymentReference;
  private _createdAt: Date;
  private _domainEvents: unknown[] = [];

  private constructor(
    id: RefundId,
    bookingId: string,
    customerId: string,
    amount: Money,
    status: RefundStatus,
    createdAt: Date
  ) {
    this._id = id;
    this._bookingId = bookingId;
    this._customerId = customerId;
    this._amount = amount;
    this._status = status;
    this._createdAt = createdAt;
  }

  public static request(
    id: RefundId,
    booking: IBookingRef,
    tickets: ITicketRef[],
    event: IEventRef,
    customerId: string,
    amount: Money,
    eligibilityService: RefundEligibilityDomainService,
    currentDate: Date
  ): Refund {
    if (!eligibilityService.isEligible(booking, tickets, event, currentDate)) {
      throw new Error('Booking tidak memenuhi syarat untuk direfund.');
    }

    const refund = new Refund(
      id,
      booking.id,
      customerId,
      amount,
      RefundStatus.Requested,
      currentDate
    );

    refund.addDomainEvent(
      new RefundRequestedDomainEvent(
        id.getValue(),
        booking.id,
        customerId,
        amount.amount
      )
    );

    return refund;
  }

  public approve(): void {
    if (this._status !== RefundStatus.Requested) {
      throw new Error('Refund hanya dapat disetujui jika statusnya Requested.');
    }

    this._status = RefundStatus.Approved;

    this.addDomainEvent(
      new RefundApprovedDomainEvent(this._id.getValue(), this._bookingId)
    );
  }

  public reject(reason: RejectionReason): void {
    if (this._status !== RefundStatus.Requested) {
      throw new Error('Refund hanya dapat ditolak jika statusnya Requested.');
    }

    this._status = RefundStatus.Rejected;
    this._rejectionReason = reason;

    this.addDomainEvent(
      new RefundRejectedDomainEvent(
        this._id.getValue(),
        this._bookingId,
        reason.getValue()
      )
    );
  }

  public markAsPaidOut(paymentReference: PaymentReference): void {
    if (this._status !== RefundStatus.Approved) {
      throw new Error('Refund hanya dapat ditandai sebagai PaidOut jika statusnya Approved.');
    }

    this._status = RefundStatus.PaidOut;
    this._paymentReference = paymentReference;

    this.addDomainEvent(
      new RefundPaidOutDomainEvent(
        this._id.getValue(),
        this._bookingId,
        paymentReference.getValue()
      )
    );
  }

  public get id(): RefundId { return this._id; }
  public get bookingId(): string { return this._bookingId; }
  public get customerId(): string { return this._customerId; }
  public get amount(): Money { return this._amount; }
  public get status(): RefundStatus { return this._status; }
  public get rejectionReason(): RejectionReason | undefined { return this._rejectionReason; }
  public get paymentReference(): PaymentReference | undefined { return this._paymentReference; }
  public get domainEvents(): unknown[] { return [...this._domainEvents]; }

  private addDomainEvent(event: unknown): void {
    this._domainEvents.push(event);
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }
}