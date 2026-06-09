export class DisableTicketCategoryCommand {
  constructor(
    public readonly eventId: string,         
    public readonly ticketCategoryId: string, 
    public readonly organizerId: string,     
  ) {}
}