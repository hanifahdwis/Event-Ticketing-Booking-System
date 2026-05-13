export class TicketCategoryName {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Ticket category name cannot be empty');
    }
    if (value.trim().length > 100) {
      throw new Error('Ticket category name cannot exceed 100 characters');
    }
    this._value = value.trim();
  }

  get value(): string {
    return this._value;
  }

  equals(other: TicketCategoryName): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}