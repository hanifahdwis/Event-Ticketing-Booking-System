export class TicketCategoryDto {
  id: string;
  name: string;
  price: number;
  currency: string;
  totalQuota: number;
  remainingQuota: number;
  salesStartDate: Date;
  salesEndDate: Date;
  isActive: boolean;
  displayStatus: string;
}

export class GetEventByIdRequestDto {
  eventId: string;
}

export class GetEventByIdResponseDto {
  id: string;
  organizerId: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  address: string;
  city: string;
  maxCapacity: number;
  status: string;
  lowestPrice: number | null;
  lowestPriceCurrency: string | null;
  ticketCategories: TicketCategoryDto[];
}