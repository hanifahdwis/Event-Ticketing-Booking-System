export class RejectionReason {
  private readonly _value: string;

  private constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Rejection reason cannot be empty');
    }
    this._value = value;
  }

  public static create(value: string): RejectionReason {
    return new RejectionReason(value);
  }

  public getValue(): string {
    return this._value;
  }
}