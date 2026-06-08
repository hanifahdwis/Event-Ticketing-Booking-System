export class RefundPaidOutDomainEvent {
  public readonly occurredOn: Date;

  constructor(
    public readonly refundId: string,
    public readonly bookingId: string,
    public readonly paymentReference: string
  ) {
    this.occurredOn = new Date();
  }
}