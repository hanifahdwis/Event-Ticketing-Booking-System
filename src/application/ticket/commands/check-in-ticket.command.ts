export class CheckInTicketCommand {
  constructor(
    public readonly ticketCode: string,
    public readonly eventId: string,
  ) {}
}