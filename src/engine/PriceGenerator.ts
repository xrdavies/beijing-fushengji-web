/**
 * Price Generation System
 *
 * Generates random market prices for 8 drugs with:
 * - Base price + random variance
 * - Market availability (leaveout system)
 */

import { DRUGS } from './types';
import { randomInt } from '@utils/random';

export class PriceGenerator {
  /**
   * Generate market prices for all 8 drugs
   *
   * @param leaveout - Number of items to hide (set price to 0)
   *                   Normally 3, but 0 in last 2 days for liquidation
   * @returns Array of 8 prices (some may be 0 if left out)
   */
  generatePrices(leaveout: number = 3): number[] {
    const prices: number[] = new Array(8);

    // Generate base prices with random variance
    // Formula: basePrice + randomInt(priceRange)
    // randomInt returns [0, max-1], so we don't add +1 here
    prices[0] = DRUGS[0].minPrice + randomInt(DRUGS[0].maxPrice - DRUGS[0].minPrice); // 100-449 (not 450)
    prices[1] = DRUGS[1].minPrice + randomInt(DRUGS[1].maxPrice - DRUGS[1].minPrice); // 15000-29999 (not 30000)
    prices[2] = DRUGS[2].minPrice + randomInt(DRUGS[2].maxPrice - DRUGS[2].minPrice); // 5-54 (not 55)
    prices[3] = DRUGS[3].minPrice + randomInt(DRUGS[3].maxPrice - DRUGS[3].minPrice); // 1000-3499 (not 3500)
    prices[4] = DRUGS[4].minPrice + randomInt(DRUGS[4].maxPrice - DRUGS[4].minPrice); // 5000-13999 (not 14000)
    prices[5] = DRUGS[5].minPrice + randomInt(DRUGS[5].maxPrice - DRUGS[5].minPrice); // 250-849 (not 850)
    prices[6] = DRUGS[6].minPrice + randomInt(DRUGS[6].maxPrice - DRUGS[6].minPrice); // 750-1499 (not 1500)
    prices[7] = DRUGS[7].minPrice + randomInt(DRUGS[7].maxPrice - DRUGS[7].minPrice); // 65-244 (not 245)

    // Randomly hide 'leaveout' number of items (set price to 0)
    // This simulates market availability - not all items are available at all locations
    for (let i = 0; i < leaveout; i++) {
      const randomDrug = randomInt(8);
      prices[randomDrug] = 0;
    }

    return prices;
  }

  /**
   * Apply price multiplier from commercial events
   * Example: University students demand DVDs → Price × 2
   */
  multiplyPrice(prices: number[], drugId: number, multiplier: number): number[] {
    const newPrices = [...prices];
    if (newPrices[drugId] > 0) {
      newPrices[drugId] = Math.floor(newPrices[drugId] * multiplier);
    }
    return newPrices;
  }

  /**
   * Apply price divisor from commercial events
   * Example: Stock market crash → Price ÷ 8
   */
  dividePrice(prices: number[], drugId: number, divisor: number): number[] {
    const newPrices = [...prices];
    if (newPrices[drugId] > 0 && divisor > 0) {
      newPrices[drugId] = Math.floor(newPrices[drugId] / divisor);
      // Ensure price doesn't go below 1
      if (newPrices[drugId] < 1) newPrices[drugId] = 1;
    }
    return newPrices;
  }

  /**
   * Get human-readable price string with Chinese currency
   */
  formatPrice(price: number): string {
    if (price === 0) return '无货';
    if (price >= 10000) {
      const wan = Math.floor(price / 10000);
      const remainder = price % 10000;
      if (remainder === 0) {
        return `¥${wan}万`;
      } else {
        return `¥${wan}.${Math.floor(remainder / 1000)}万`;
      }
    }
    return `¥${price.toLocaleString('zh-CN')}`;
  }

  /**
   * Validate generated prices
   */
  validatePrices(prices: number[]): boolean {
    if (prices.length !== 8) return false;

    for (let i = 0; i < 8; i++) {
      const price = prices[i];
      const drug = DRUGS[i];

      // Price must be 0 (unavailable) or within valid range
      if (price !== 0 && (price < drug.minPrice || price > drug.maxPrice)) {
        console.warn(
          `Price out of range for ${drug.name}: ${price} (expected ${drug.minPrice}-${drug.maxPrice})`
        );
        // Allow it anyway - events can cause prices outside normal range
      }
    }

    return true;
  }
}

// Export singleton instance
export const priceGenerator = new PriceGenerator();
