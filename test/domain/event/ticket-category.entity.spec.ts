import { TicketCategory } from '../../../src/domain/event/entities/ticket-category.entity';
import { SalesPeriod } from '../../../src/domain/event/value-objects/sales-period.vo';
import { TicketCategoryId } from '../../../src/domain/event/value-objects/ticket-category-id.vo';
import { TicketCategoryName } from '../../../src/domain/event/value-objects/ticket-category-name.vo';
import { Quota } from '../../../src/domain/event/value-objects/quota.vo';
import { Money } from '../../../src/domain/shared/value-objects/money.vo';

const dayAfter = (base: Date, days: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

const makeSalesPeriod = (active = true): SalesPeriod => {
  const now = new Date();
  if (active) {
    return new SalesPeriod(dayAfter(now, -1), dayAfter(now, 10));
  }
  return new SalesPeriod(dayAfter(now, -10), dayAfter(now, -1));
};

const makeTicketCategory = (overrides: Partial<{
  quota: Quota;
  isActive: boolean;
  salesPeriod: SalesPeriod;
}> = {}): TicketCategory => {
  return new TicketCategory({
    id: new TicketCategoryId(),
    name: new TicketCategoryName('Regular'),
    price: new Money(150000, 'IDR'),
    quota: overrides.quota ?? new Quota(100),
    salesPeriod: overrides.salesPeriod ?? makeSalesPeriod(true),
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
  });
};

describe('TicketCategory Entity', () => {
  describe('disable()', () => {
    it('should disable an active ticket category', () => {
      const tc = makeTicketCategory();
      tc.disable();
      expect(tc.isActive).toBe(false);
    });
  });

  describe('reserveQuota()', () => {
    it('should reduce remaining quota by the reserved amount', () => {
      const tc = makeTicketCategory({ quota: new Quota(100) });
      tc.reserveQuota(10);
      expect(tc.quota.remaining).toBe(90);
    });

    it('should throw when reserving more than remaining quota', () => {
      const tc = makeTicketCategory({ quota: new Quota(10) });
      expect(() => tc.reserveQuota(11)).toThrow('Insufficient remaining quota');
    });

    it('should throw when reserving from an inactive ticket category', () => {
      const tc = makeTicketCategory({ isActive: false });
      expect(() => tc.reserveQuota(1)).toThrow(
        'Cannot reserve quota from an inactive ticket category',
      );
    });
  });

  describe('releaseQuota()', () => {
    it('should increase remaining quota by the released amount', () => {
      const tc = makeTicketCategory({ quota: new Quota(100, 80) });
      tc.releaseQuota(10);
      expect(tc.quota.remaining).toBe(90);
    });

    it('should throw when releasing more than total quota allows', () => {
      const tc = makeTicketCategory({ quota: new Quota(100) });
      expect(() => tc.releaseQuota(1)).toThrow(
        'Released quota cannot exceed total quota',
      );
    });
  });

  describe('isSoldOut()', () => {
    it('should return true when remaining quota is zero', () => {
      const tc = makeTicketCategory({ quota: new Quota(10, 0) });
      expect(tc.isSoldOut()).toBe(true);
    });

    it('should return false when there is remaining quota', () => {
      const tc = makeTicketCategory({ quota: new Quota(10, 5) });
      expect(tc.isSoldOut()).toBe(false);
    });
  });

  describe('isAvailableAt()', () => {
    it('should return true when active and within sales period', () => {
      const tc = makeTicketCategory({ salesPeriod: makeSalesPeriod(true) });
      expect(tc.isAvailableAt(new Date())).toBe(true);
    });

    it('should return false when inactive', () => {
      const tc = makeTicketCategory({
        isActive: false,
        salesPeriod: makeSalesPeriod(true),
      });
      expect(tc.isAvailableAt(new Date())).toBe(false);
    });

    it('should return false when sales period is closed', () => {
      const tc = makeTicketCategory({ salesPeriod: makeSalesPeriod(false) });
      expect(tc.isAvailableAt(new Date())).toBe(false);
    });
  });
});