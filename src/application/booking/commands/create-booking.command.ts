export class CreateBookingCommand {
  constructor(
    public readonly customerId: string,
    public readonly eventId: string,
    public readonly ticketCategoryId: string,
    public readonly quantity: number,
  ) {}
}