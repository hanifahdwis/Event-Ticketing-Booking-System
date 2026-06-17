export class RequestRefundCommand {
  constructor(
    public readonly bookingId: string,
    public readonly customerId: string,
  ) {}
}