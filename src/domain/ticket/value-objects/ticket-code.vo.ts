import { randomUUID } from 'crypto';

export class TicketCode {
  private readonly _value: string;

  constructor(value?: string) {
    if (value !== undefined) {
      if (!value || value.trim().length === 0) {
        throw new Error('Ticket code cannot be empty');
      }
      this._value = value.trim();
    } else {
      this._value = 'TKT-' + randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: TicketCode): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}