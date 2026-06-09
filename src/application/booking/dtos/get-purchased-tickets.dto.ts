export class PurchasedTicketDto {
  ticketId: string;
  ticketCode: string;
  eventId: string;
  ticketCategoryId: string;
  status: string;    
}

export class GetPurchasedTicketsResponseDto {
  bookingId: string;
  tickets: PurchasedTicketDto[];
}
