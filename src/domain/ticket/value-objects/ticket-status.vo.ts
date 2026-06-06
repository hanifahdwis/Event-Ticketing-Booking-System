export enum TicketStatusEnum {
  ACTIVE = 'Active',
  CHECKED_IN = 'CheckedIn',
  CANCELLED = 'Cancelled',
}

export class TicketStatus {
  private readonly _value: TicketStatusEnum;

  constructor(value: TicketStatusEnum) {
    this._value = value;
  }

  static active(): TicketStatus {
    return new TicketStatus(TicketStatusEnum.ACTIVE);
  }

  static checkedIn(): TicketStatus {
    return new TicketStatus(TicketStatusEnum.CHECKED_IN);
  }

  static cancelled(): TicketStatus {
    return new TicketStatus(TicketStatusEnum.CANCELLED);
  }

  get value(): TicketStatusEnum {
    return this._value;
  }

  isActive(): boolean {
    return this._value === TicketStatusEnum.ACTIVE;
  }

  isCheckedIn(): boolean {
    return this._value === TicketStatusEnum.CHECKED_IN;
  }

  isCancelled(): boolean {
    return this._value === TicketStatusEnum.CANCELLED;
  }

  equals(other: TicketStatus): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}