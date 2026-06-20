export class GetEventParticipantsQuery {
  constructor(
    public readonly eventId: string,
    public readonly organizerId: string,
  ) {}
}

