export class RefundRejectedDomainEvent {
  public readonly occurredOn: Date;

  constructor(
    public readonly refundId: string,
    public readonly bookingId: string,
    public readonly reason: string
  ) {
    this.occurredOn = new Date();
  }
}