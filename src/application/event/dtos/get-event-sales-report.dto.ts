export class TicketCategorySalesDto {
  ticketCategoryId: string;
  ticketCategoryName: string;
  ticketsSold: number;  
}

export class BookingStatusCountDto {
  pendingPayment: number;
  paid: number;
  expired: number;
  refunded: number;
}

export class GetEventSalesReportResponseDto {
  eventId: string;
  eventName: string;
  salesPerCategory: TicketCategorySalesDto[];
  bookingStatusCounts: BookingStatusCountDto;
  totalRevenue: number;
  currency: string;
}