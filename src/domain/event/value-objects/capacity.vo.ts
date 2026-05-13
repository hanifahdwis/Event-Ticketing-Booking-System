export class Capacity {
  private readonly _value: number;

  constructor(value: number) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error('Capacity must be a positive integer greater than zero');
    }
    this._value = value;
  }

  get value(): number {
    return this._value;
  }

  isExceededBy(totalQuota: number): boolean {
    return totalQuota > this._value;
  }

  equals(other: Capacity): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return String(this._value);
  }
}