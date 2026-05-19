export enum BookingStatusEnum {
  PENDING_PAYMENT = 'PendingPayment',
  PAID = 'Paid',
  EXPIRED = 'Expired',
  REFUNDED = 'Refunded',
}

export class BookingStatus {
  private readonly _value: BookingStatusEnum;

  constructor(value: BookingStatusEnum) {
    this._value = value;
  }

  static pendingPayment(): BookingStatus {
    return new BookingStatus(BookingStatusEnum.PENDING_PAYMENT);
  }

  static paid(): BookingStatus {
    return new BookingStatus(BookingStatusEnum.PAID);
  }

  static expired(): BookingStatus {
    return new BookingStatus(BookingStatusEnum.EXPIRED);
  }

  static refunded(): BookingStatus {
    return new BookingStatus(BookingStatusEnum.REFUNDED);
  }

  get value(): BookingStatusEnum {
    return this._value;
  }

  isPendingPayment(): boolean {
    return this._value === BookingStatusEnum.PENDING_PAYMENT;
  }

  isPaid(): boolean {
    return this._value === BookingStatusEnum.PAID;
  }

  isExpired(): boolean {
    return this._value === BookingStatusEnum.EXPIRED;
  }

  isRefunded(): boolean {
    return this._value === BookingStatusEnum.REFUNDED;
  }

  isActive(): boolean {
    return this.isPendingPayment() || this.isPaid();
  }

  equals(other: BookingStatus): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}