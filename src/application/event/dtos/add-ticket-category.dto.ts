export class AddTicketCategoryRequestDto {
  eventId: string;
  organizerId: string;
  name: string;
  price: number;
  currency?: string;
  quota: number;
  salesStartDate: Date;
  salesEndDate: Date;
}

export class AddTicketCategoryResponseDto {
  ticketCategoryId: string;
  eventId: string;
  name: string;
  price: number;
  currency: string;
  quota: number;
  salesStartDate: Date;
  salesEndDate: Date;
  isActive: boolean;
}