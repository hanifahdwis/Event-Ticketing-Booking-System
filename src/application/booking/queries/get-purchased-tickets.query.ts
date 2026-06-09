export class GetPurchasedTicketsQuery {
  constructor(
    public readonly customerId: string,
    public readonly bookingId: string,
  ) {}
}