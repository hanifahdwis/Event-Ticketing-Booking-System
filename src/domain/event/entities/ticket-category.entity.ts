import { Money } from '../../shared/value-objects/money.vo';
import { Quota } from '../value-objects/quota.vo';
import { SalesPeriod } from '../value-objects/sales-period.vo';
import { TicketCategoryId } from '../value-objects/ticket-category-id.vo';
import { TicketCategoryName } from '../value-objects/ticket-category-name.vo';

export interface TicketCategoryProps {
  id: TicketCategoryId;
  name: TicketCategoryName;
  price: Money;
  quota: Quota;
  salesPeriod: SalesPeriod;
  isActive: boolean;
}

export class TicketCategory {
  private _id: TicketCategoryId;
  private _name: TicketCategoryName;
  private _price: Money;
  private _quota: Quota;
  private _salesPeriod: SalesPeriod;
  private _isActive: boolean;

  constructor(props: TicketCategoryProps) {
    this._id = props.id;
    this._name = props.name;
    this._price = props.price;
    this._quota = props.quota;
    this._salesPeriod = props.salesPeriod;
    this._isActive = props.isActive;
  }

  get id(): TicketCategoryId {
    return this._id;
  }

  get name(): TicketCategoryName {
    return this._name;
  }

  get price(): Money {
    return this._price;
  }

  get quota(): Quota {
    return this._quota;
  }

  get salesPeriod(): SalesPeriod {
    return this._salesPeriod;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  disable(): void {
    this._isActive = false;
  }

  reserveQuota(amount: number): void {
    if (!this._isActive) {
      throw new Error('Cannot reserve quota from an inactive ticket category');
    }
    this._quota = this._quota.reserve(amount);
  }

  releaseQuota(amount: number): void {
    this._quota = this._quota.release(amount);
  }

  isSoldOut(): boolean {
    return this._quota.isSoldOut();
  }

  isAvailableAt(date: Date = new Date()): boolean {
    return this._isActive && this._salesPeriod.isActive(date);
  }
}