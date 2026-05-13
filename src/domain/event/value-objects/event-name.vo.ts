export class EventName {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Event name cannot be empty');
    }
    if (value.trim().length > 255) {
      throw new Error('Event name cannot exceed 255 characters');
    }
    this._value = value.trim();
  }

  get value(): string {
    return this._value;
  }

  equals(other: EventName): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}