import { describe, it, expect } from 'vitest';
import { calculateDurationMultiplier, toRentalItem } from '../checkoutData';
import { formatCurrency } from '../../../utils/formatCurrency';

describe('Pricing Engine & Checkout Calculations', () => {
  describe('calculateDurationMultiplier', () => {
    it('should return 1.0 for 1 or 2 days', () => {
      expect(calculateDurationMultiplier(1)).toBe(1.0);
      expect(calculateDurationMultiplier(2)).toBe(1.0);
    });

    it('should scale by 0.2 per day starting day 3', () => {
      expect(calculateDurationMultiplier(3)).toBeCloseTo(1.2);
      expect(calculateDurationMultiplier(4)).toBeCloseTo(1.4);
      expect(calculateDurationMultiplier(5)).toBeCloseTo(1.6);
      expect(calculateDurationMultiplier(7)).toBeCloseTo(2.0);
    });
  });

  describe('toRentalItem', () => {
    it('should compute pricing correctly for a 2-day rental', () => {
      const cartItem = {
        costumeId: 1,
        title: 'Áo dài Tết',
        unitPrice: 100000,
        originalUnitPrice: 100000,
        depositPrice: 500000,
        rentalStartDate: '2026-11-01',
        rentalEndDate: '2026-11-03',
        quantity: 1,
      };

      const rentalItem = toRentalItem(cartItem, 0);

      expect(rentalItem.rentalDays).toBe(2);
      expect(rentalItem.multiplier).toBe(1.0);
      expect(rentalItem.rentalFee).toBe(100000);
      // deposit = 500000 * 1.2 - 100000 = 500000
      expect(rentalItem.deposit).toBe(500000);
      expect(rentalItem.subtotal).toBe(600000);
    });

    it('should compute discounted pricing without increasing deposit', () => {
      const cartItem = {
        costumeId: 2,
        title: 'Vest Nam',
        unitPrice: 80000,
        originalUnitPrice: 100000,
        depositPrice: 500000,
        rentalStartDate: '2026-11-01',
        rentalEndDate: '2026-11-03',
        quantity: 1,
      };

      const rentalItem = toRentalItem(cartItem, 1);

      expect(rentalItem.rentalDays).toBe(2);
      expect(rentalItem.rentalFee).toBe(80000);
      expect(rentalItem.discountAmount).toBe(20000);
      expect(rentalItem.deposit).toBe(500000);
      expect(rentalItem.subtotal).toBe(580000);
    });
  });

  describe('formatCurrency', () => {
    it('should format numbers with Vietnamese locale', () => {
      const formatted = formatCurrency(100000);
      expect(formatted).toContain('100.000');
    });
  });
});
