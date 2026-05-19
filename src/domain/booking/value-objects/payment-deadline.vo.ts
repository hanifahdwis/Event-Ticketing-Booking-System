export const PAYMENT_DEADLINE_MINUTES = 15;

export class PaymentDeadline {
  private readonly _value: Date;
  
  constructor(value?: Date) {
    if (value) {
      this._value = value;
    } else {
      const deadline = new Date();
      deadline.setMinutes(deadline.getMinutes() + PAYMENT_DEADLINE_MINUTES);
      this._value = deadline;
    }
  }

  get value(): Date {
    return this._value;
  }

  isExpired(at: Date = new Date()): boolean {
    return at > this._value;
  }

  equals(other: PaymentDeadline): boolean {
    return this._value.getTime() === other._value.getTime();
  }

  toString(): string {
    return this._value.toISOString();
  }
}