export class EventSchedule {
  private readonly _startDate: Date;
  private readonly _endDate: Date;

  constructor(startDate: Date, endDate: Date) {
    if (endDate < startDate) {
      throw new Error('End date cannot be earlier than start date');
    }
    this._startDate = startDate;
    this._endDate = endDate;
  }

  get startDate(): Date {
    return this._startDate;
  }

  get endDate(): Date {
    return this._endDate;
  }

  isOnEventDay(date: Date): boolean {
    const d = date.toDateString();
    return (
      d >= this._startDate.toDateString() &&
      d <= this._endDate.toDateString()
    );
  }

  equals(other: EventSchedule): boolean {
    return (
      this._startDate.getTime() === other._startDate.getTime() &&
      this._endDate.getTime() === other._endDate.getTime()
    );
  }
}