export class Location {
  private readonly _address: string;
  private readonly _city: string;

  constructor(address: string, city: string) {
    if (!address || address.trim().length === 0) {
      throw new Error('Location address cannot be empty');
    }
    if (!city || city.trim().length === 0) {
      throw new Error('Location city cannot be empty');
    }
    this._address = address.trim();
    this._city = city.trim();
  }

  get address(): string {
    return this._address;
  }

  get city(): string {
    return this._city;
  }

  equals(other: Location): boolean {
    return this._address === other._address && this._city === other._city;
  }

  toString(): string {
    return `${this._address}, ${this._city}`;
  }
}