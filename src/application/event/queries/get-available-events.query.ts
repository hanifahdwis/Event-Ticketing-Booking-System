export class GetAvailableEventsQuery {
  constructor(
    public readonly filterByDate?: Date,
    public readonly filterByCity?: string,
  ) {}
}