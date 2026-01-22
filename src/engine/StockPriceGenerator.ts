/**
 * Stock price generation system
 *
 * High-risk model with daily noise and rare jump spikes.
 */

import { STOCKS, type StockCandle } from './types';

export class StockPriceGenerator {
  private readonly driftMax = 0.01;

  generateInitialPrices(): number[] {
    return STOCKS.map((stock) =>
      this.randomIntRange(stock.startMin, stock.startMax)
    );
  }

  generateInitialHistory(length: number): { history: StockCandle[][]; prices: number[] } {
    const safeLength = Math.max(1, Math.floor(length));
    let prices = this.generateInitialPrices();
    const history: StockCandle[][] = prices.map((price, index) => [
      this.buildCandle(index, price, price),
    ]);

    for (let step = 1; step < safeLength; step++) {
      const nextPrices = this.generateNextPrices(prices);
      for (let i = 0; i < nextPrices.length; i++) {
        history[i].push(this.buildCandle(i, prices[i], nextPrices[i]));
      }
      prices = nextPrices;
    }

    return { history, prices };
  }

  generateHistoryFromCurrent(prices: number[], length: number): StockCandle[][] {
    const safeLength = Math.max(1, Math.floor(length));
    return STOCKS.map((stock, index) => {
      const current = prices[index] ?? stock.startMin;
      const closes: number[] = [current];

      let cursor = current;
      for (let step = 1; step < safeLength; step++) {
        const delta = this.randomFloatRange(-stock.dailyVolatility, stock.dailyVolatility);
        const denom = 1 + delta;
        const previous = denom <= 0.1 ? cursor : Math.round(cursor / denom);
        const clamped = this.clamp(previous, stock.minPrice, stock.maxPrice);
        closes.unshift(clamped);
        cursor = clamped;
      }

      const candles: StockCandle[] = [];
      for (let i = 0; i < closes.length; i++) {
        const open = i === 0 ? closes[i] : closes[i - 1];
        candles.push(this.buildCandle(index, open, closes[i]));
      }

      return candles;
    });
  }

  generateNextPrices(currentPrices: number[]): number[] {
    return STOCKS.map((stock, index) => {
      const base =
        typeof currentPrices[index] === 'number' && currentPrices[index] > 0
          ? currentPrices[index]
          : this.randomIntRange(stock.startMin, stock.startMax);

      const drift = this.randomFloatRange(-this.driftMax, this.driftMax);
      const noise = this.randomFloatRange(
        -stock.dailyVolatility,
        stock.dailyVolatility
      );

      let jump = 0;
      if (Math.random() < stock.jumpChance) {
        const direction = Math.random() < 0.5 ? -1 : 1;
        jump =
          direction * this.randomFloatRange(stock.jumpMin, stock.jumpMax);
      }

      const next = Math.round(base * (1 + drift + noise + jump));
      return this.clamp(next, stock.minPrice, stock.maxPrice);
    });
  }

  clampPrice(price: number, stockId: number): number {
    const stock = STOCKS[stockId];
    if (!stock) {
      return price;
    }
    return this.clamp(price, stock.minPrice, stock.maxPrice);
  }

  buildCandle(stockId: number, open: number, close: number): StockCandle {
    const stock = STOCKS[stockId];
    const swingMax = stock ? stock.dailyVolatility * 0.6 : 0.06;
    const baseHigh = Math.max(open, close);
    const baseLow = Math.min(open, close);
    const extraHigh = baseHigh * (1 + Math.random() * swingMax);
    const extraLow = baseLow * (1 - Math.random() * swingMax);

    const high = stock ? this.clampPrice(Math.round(extraHigh), stockId) : Math.round(extraHigh);
    const low = stock ? this.clampPrice(Math.round(extraLow), stockId) : Math.round(extraLow);

    return { open, high, low, close };
  }

  private randomIntRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomFloatRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}

export const stockPriceGenerator = new StockPriceGenerator();
