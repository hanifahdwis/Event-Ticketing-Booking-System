export class PaymentReference {
  private readonly _value: string;

  private constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Payment reference tidak boleh kosong');
    }
    this._value = value;
  }

  public static create(value: string): PaymentReference {
    return new PaymentReference(value);
  }

  public getValue(): string {
    return this._value;
  }
}