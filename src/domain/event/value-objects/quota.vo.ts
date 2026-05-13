export class Quota {
  private readonly _total: number;
  private readonly _remaining: number;

  constructor(total: number, remaining?: number) {
    if (!Number.isInteger(total) || total <= 0) {
      throw new Error('Quota must be a positive integer greater than zero');
    }
    const rem = remaining !== undefined ? remaining : total;
    if (rem < 0) {
      throw new Error('Remaining quota cannot be negative');
    }
    if (rem > total) {
      throw new Error('Remaining quota cannot exceed total quota');
    }
    this._total = total;
    this._remaining = rem;
  }

  get total(): number {
    return this._total;
  }

  get remaining(): number {
    return this._remaining;
  }

  isSoldOut(): boolean {
    return this._remaining === 0;
  }

  reserve(amount: number): Quota {
    if (amount <= 0) {
      throw new Error('Reserve amount must be greater than zero');
    }
    if (amount > this._remaining) {
      throw new Error('Insufficient remaining quota');
    }
    return new Quota(this._total, this._remaining - amount);
  }

  release(amount: number): Quota {
    if (amount <= 0) {
      throw new Error('Release amount must be greater than zero');
    }
    const newRemaining = this._remaining + amount;
    if (newRemaining > this._total) {
      throw new Error('Released quota cannot exceed total quota');
    }
    return new Quota(this._total, newRemaining);
  }

  equals(other: Quota): boolean {
    return this._total === other._total && this._remaining === other._remaining;
  }
}