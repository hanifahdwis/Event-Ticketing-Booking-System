export class Quantity {
  private readonly _value: number;

  constructor(value: number) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error('Quantity must be a positive integer greater than zero');
    }
    this._value = value;
  }

  get value(): number {
    return this._value;
  }

  equals(other: Quantity): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return String(this._value);
  }
}