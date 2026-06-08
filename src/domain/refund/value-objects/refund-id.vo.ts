import { randomUUID } from 'crypto';

export class RefundId {
  private readonly _value: string;

  private constructor(value: string) {
    if (!value || !this.isValidUUID(value)) {
      throw new Error('Format RefundId tidak valid. Harus berupa UUID.');
    }
    this._value = value;
  }

  public static create(): RefundId {
    return new RefundId(randomUUID());
  }

  public static restore(value: string): RefundId {
    return new RefundId(value);
  }

  public getValue(): string {
    return this._value;
  }

  private isValidUUID(uuid: string): boolean {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
  }
}