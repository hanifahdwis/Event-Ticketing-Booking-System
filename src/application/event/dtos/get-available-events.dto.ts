export class GetAvailableEventsRequestDto {
  filterByDate?: Date;
  filterByCity?: string;
}

export class AvailableEventDto {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  address: string;
  city: string;
  status: string;
  lowestPrice: number | null;
  lowestPriceCurrency: string | null;
}

export class GetAvailableEventsResponseDto {
  events: AvailableEventDto[];
}