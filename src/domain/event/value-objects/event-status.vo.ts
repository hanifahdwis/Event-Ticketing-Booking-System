export enum EventStatusEnum {
  DRAFT = 'Draft',
  PUBLISHED = 'Published',
  CANCELLED = 'Cancelled',
  COMPLETED = 'Completed',
}

export class EventStatus {
  private readonly _value: EventStatusEnum;

  constructor(value: EventStatusEnum) {
    this._value = value;
  }

  static draft(): EventStatus {
    return new EventStatus(EventStatusEnum.DRAFT);
  }

  static published(): EventStatus {
    return new EventStatus(EventStatusEnum.PUBLISHED);
  }

  static cancelled(): EventStatus {
    return new EventStatus(EventStatusEnum.CANCELLED);
  }

  static completed(): EventStatus {
    return new EventStatus(EventStatusEnum.COMPLETED);
  }

  get value(): EventStatusEnum {
    return this._value;
  }

  isDraft(): boolean {
    return this._value === EventStatusEnum.DRAFT;
  }

  isPublished(): boolean {
    return this._value === EventStatusEnum.PUBLISHED;
  }

  isCancelled(): boolean {
    return this._value === EventStatusEnum.CANCELLED;
  }

  isCompleted(): boolean {
    return this._value === EventStatusEnum.COMPLETED;
  }

  equals(other: EventStatus): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}