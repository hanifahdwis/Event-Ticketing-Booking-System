export class CreateEventRequestDto {
  organizerId: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  address: string;
  city: string;
  maxCapacity: number;
}

export class CreateEventResponseDto {
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
}