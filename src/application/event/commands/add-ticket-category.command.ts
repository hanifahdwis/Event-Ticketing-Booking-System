export class AddTicketCategoryCommand {
  constructor(
    public readonly eventId: string,
    public readonly organizerId: string,
    public readonly name: string,
    public readonly price: number,
    public readonly quota: number,
    public readonly salesStartDate: Date,
    public readonly salesEndDate: Date,
    public readonly currency: string = 'IDR',
  ) {}
}