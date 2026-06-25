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
    const dateOnly = this.toDateOnly(date);
    const startOnly = this.toDateOnly(this._startDate);
    const endOnly = this.toDateOnly(this._endDate);
    return dateOnly >= startOnly && dateOnly <= endOnly;
  }

  private toDateOnly(date: Date): number {
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  }

  equals(other: EventSchedule): boolean {
    return (
      this._startDate.getTime() === other._startDate.getTime() &&
      this._endDate.getTime() === other._endDate.getTime()
    );
  }
}