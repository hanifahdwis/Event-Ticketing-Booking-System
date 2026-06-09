export class CreateBookingResponseDto {
  bookingId: string;
  customerId: string;
  eventId: string;
  ticketCategoryId: string;
  quantity: number;
  totalPrice: number;
  currency: string;
  status: string;
  paymentDeadline: Date;
}