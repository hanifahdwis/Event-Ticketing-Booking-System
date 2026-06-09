import { randomUUID } from 'crypto';

export class OrganizerId {
  private readonly _value: string;

  constructor(value?: string) {
    this._value = value ?? randomUUID();
  }

  get value(): string {
    return this._value;
  }

  equals(other: OrganizerId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}