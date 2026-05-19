import { Quantity } from '../../../src/domain/booking/value-objects/quantity.vo';

describe('Quantity Value Object', () => {

  it('should create a valid quantity with a positive integer', () => {
    const q = new Quantity(5);
    expect(q.value).toBe(5);
  });

  it('should create quantity of 1', () => {
    const q = new Quantity(1);
    expect(q.value).toBe(1);
  });

  it('should create a large quantity', () => {
    const q = new Quantity(999);
    expect(q.value).toBe(999);
  });

  it('should throw when quantity is zero (US 8 – quantity > 0)', () => {
    expect(() => new Quantity(0)).toThrow(
      'Quantity must be a positive integer greater than zero',
    );
  });

  it('should throw when quantity is negative', () => {
    expect(() => new Quantity(-1)).toThrow(
      'Quantity must be a positive integer greater than zero',
    );
  });

  it('should throw when quantity is a decimal', () => {
    expect(() => new Quantity(1.5)).toThrow(
      'Quantity must be a positive integer greater than zero',
    );
  });

  it('should throw when quantity is NaN', () => {
    expect(() => new Quantity(NaN)).toThrow(
      'Quantity must be a positive integer greater than zero',
    );
  });

  it('should return true for equals when values are the same', () => {
    const a = new Quantity(3);
    const b = new Quantity(3);
    expect(a.equals(b)).toBe(true);
  });

  it('should return false for equals when values differ', () => {
    const a = new Quantity(3);
    const b = new Quantity(4);
    expect(a.equals(b)).toBe(false);
  });

  it('should return string representation', () => {
    expect(new Quantity(7).toString()).toBe('7');
  });
});