export class ParticipantDto {
  customerId: string;        
  ticketCategoryId: string;
  ticketCategoryName: string;
  ticketCode: string;
  checkInStatus: string;     
}

export class GetEventParticipantsResponseDto {
  eventId: string;
  totalParticipants: number;
  participants: ParticipantDto[];
}
