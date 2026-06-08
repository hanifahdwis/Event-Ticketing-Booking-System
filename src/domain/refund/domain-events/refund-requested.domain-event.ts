export class RefundRequestedDomainEvent {
  public readonly occurredOn: Date;

  constructor(
    public readonly refundId: string,
    public readonly bookingId: string,
    public readonly customerId: string,
    public readonly amount: number
  ) {
    this.occurredOn = new Date();
  }
}