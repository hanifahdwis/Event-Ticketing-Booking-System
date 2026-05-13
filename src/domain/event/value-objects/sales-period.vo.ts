export class SalesPeriod {
  private readonly _startDate: Date;
  private readonly _endDate: Date;

  constructor(startDate: Date, endDate: Date, eventStartDate?: Date) {
    if (endDate < startDate) {
      throw new Error('Sales end date cannot be earlier than sales start date');
    }
    if (eventStartDate && endDate > eventStartDate) {
      throw new Error(
        'Sales period must end before or at the event start date',
      );
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

  isActive(at: Date = new Date()): boolean {
    return at >= this._startDate && at <= this._endDate;
  }

  isComingSoon(at: Date = new Date()): boolean {
    return at < this._startDate;
  }

  isClosed(at: Date = new Date()): boolean {
    return at > this._endDate;
  }

  equals(other: SalesPeriod): boolean {
    return (
      this._startDate.getTime() === other._startDate.getTime() &&
      this._endDate.getTime() === other._endDate.getTime()
    );
  }
}