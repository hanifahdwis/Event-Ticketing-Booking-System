import { Money } from '../../shared/value-objects/money.vo';
import { Quantity } from '../value-objects/quantity.vo';

export class BookingPricingDomainService {
  calculateTotal(
    unitPrice: Money,
    quantity: Quantity,
    serviceFee?: Money,
  ): Money {
    let total = unitPrice.multiply(quantity.value);

    if (serviceFee) {
      total = total.add(serviceFee); 
    }

    if (total.amount < 0) {
      throw new Error('Total price cannot be negative');
    }

    return total;
  }
}