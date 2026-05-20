export class PublishEventRequestDto {
  eventId: string;
  organizerId: string;
}

export class PublishEventResponseDto {
  id: string;
  status: string;
  publishedAt: Date;
}