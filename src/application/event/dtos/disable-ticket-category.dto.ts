export class DisableTicketCategoryResponseDto {
  ticketCategoryId: string;
  eventId: string;
  isActive: boolean;  
  disabledAt: Date;
}