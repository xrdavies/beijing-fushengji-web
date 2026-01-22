/**
 * Game Engine - Core game logic and mechanics
 *
 * Handles all game operations:
 * - Trading (buy/sell)
 * - Financial (bank/debt)
 * - Services (hospital/house/wangba)
 * - Location changes and event triggering
 */

import type { GameState, GameEvent, Location, Result, StockCandle } from './types';
import { DRUGS, GAME_CONSTANTS, STOCKS, Ok, Err } from './types';
import { priceGenerator } from './PriceGenerator';
import { stockPriceGenerator } from './StockPriceGenerator';
import { eventSystem } from './EventSystem';

export class GameEngine {
  /**
   * Buy a drug
   */
  buyDrug(state: GameState, drugId: number, quantity: number): Result<void> {
    // Validation
    if (drugId < 0 || drugId > 7) {
      return Err('无效的商品ID');
    }

    const price = state.marketPrices[drugId];
    if (price === 0) {
      return Err('该商品暂时无货');
    }

    if (quantity <= 0) {
      return Err('购买数量必须大于0');
    }

    // Check affordability
    const totalCost = price * quantity;
    if (state.cash < totalCost) {
      return Err(`现金不足！需要¥${totalCost.toLocaleString('zh-CN')}，你只有¥${state.cash.toLocaleString('zh-CN')}`);
    }

    // Check capacity
    const currentItems = state.inventory.reduce((sum, item) => sum + item.quantity, 0);
    if (currentItems + quantity > state.capacity) {
      const available = state.capacity - currentItems;
      return Err(`容量不足！你只能再携带${available}件商品`);
    }

    // Execute purchase
    state.cash -= totalCost;

    const item = state.inventory[drugId];
    const oldQuantity = item.quantity;
    const newQuantity = oldQuantity + quantity;

    // Update average price
    // Formula: (oldAvg * oldQty + price * qty) / (oldQty + qty)
    item.avgPrice = Math.floor(
      (item.avgPrice * oldQuantity + price * quantity) / newQuantity
    );
    item.quantity = newQuantity;
    item.id = drugId;

    return Ok(undefined);
  }

  /**
   * Sell a drug
   */
  sellDrug(state: GameState, drugId: number, quantity: number): Result<void> {
    // Validation
    if (drugId < 0 || drugId > 7) {
      return Err('无效的商品ID');
    }

    const item = state.inventory[drugId];
    if (item.quantity === 0) {
      return Err('你没有这件商品');
    }

    if (quantity <= 0) {
      return Err('出售数量必须大于0');
    }

    if (quantity > item.quantity) {
      return Err(`你只有${item.quantity}件${DRUGS[drugId].name}`);
    }

    const price = state.marketPrices[drugId];
    if (price === 0) {
      return Err('该商品当前无人收购');
    }

    // Execute sale
    const revenue = price * quantity;
    state.cash += revenue;
    item.quantity -= quantity;

    // Reset item if all sold
    if (item.quantity === 0) {
      item.id = -1;
      item.avgPrice = 0;
    }

    // Fame penalty for selling certain items
    // - "劣质假酒" → fame -= 10 (Drug ID 3)
    // - "上海小宝贝" → fame -= 7 (Drug ID 4)
    if (drugId === 3) {
      state.fame -= 10;  // 劣质假酒
      if (state.fame < 0) state.fame = 0;
    } else if (drugId === 4) {
      state.fame -= 7;  // 上海小宝贝
      if (state.fame < 0) state.fame = 0;
    }

    return Ok(undefined);
  }

  /**
   * Buy stock shares
   */
  buyStock(state: GameState, stockId: number, shares: number): Result<void> {
    if (stockId < 0 || stockId >= STOCKS.length) {
      return Err('无效的股票ID');
    }

    if (shares <= 0) {
      return Err('购买数量必须大于0');
    }

    const price = state.stockPrices[stockId];
    if (!price || price <= 0) {
      return Err('该股票暂不可交易');
    }

    const totalCost = price * shares;
    const fee = Math.ceil(totalCost * GAME_CONSTANTS.STOCK_TRADE_FEE_RATE);
    const totalWithFee = totalCost + fee;

    if (state.cash < totalWithFee) {
      return Err(`现金不足！需要¥${totalWithFee.toLocaleString('zh-CN')}`);
    }

    state.cash -= totalWithFee;

    const holding = state.stockHoldings[stockId];
    const oldShares = holding.shares;
    const newShares = oldShares + shares;
    holding.avgPrice = Math.floor(
      (holding.avgPrice * oldShares + price * shares) / newShares
    );
    holding.shares = newShares;

    return Ok(undefined);
  }

  /**
   * Sell stock shares
   */
  sellStock(state: GameState, stockId: number, shares: number): Result<void> {
    if (stockId < 0 || stockId >= STOCKS.length) {
      return Err('无效的股票ID');
    }

    if (shares <= 0) {
      return Err('出售数量必须大于0');
    }

    const holding = state.stockHoldings[stockId];
    if (!holding || holding.shares <= 0) {
      return Err('你没有这只股票');
    }

    if (shares > holding.shares) {
      return Err(`你只有${holding.shares}股${STOCKS[stockId].name}`);
    }

    const price = state.stockPrices[stockId];
    if (!price || price <= 0) {
      return Err('该股票暂不可交易');
    }

    const revenue = price * shares;
    const fee = Math.ceil(revenue * GAME_CONSTANTS.STOCK_TRADE_FEE_RATE);
    state.cash += Math.max(0, revenue - fee);
    holding.shares -= shares;

    if (holding.shares === 0) {
      holding.avgPrice = 0;
    }

    return Ok(undefined);
  }

  /**
   * Change location - triggers the core game loop
   *
   * This is the main game loop that executes on each location change:
   * 1. Generate new market prices
   * 2. Generate new stock prices
   * 3. Update finances (debt/bank interest)
   * 4. Trigger commercial events
   * 5. Trigger stock events
   * 6. Trigger health events
   * 7. Trigger theft events
   * 8. Check debt penalty
   * 9. Update location and decrement time
   * 10. Check game over (time ran out)
   * 11. Check game over (health depleted)
   * 12. Check end game warning (ensure it is shown first)
   */
  changeLocation(state: GameState, newLocation: Location): GameEvent[] {
    const events: GameEvent[] = [];

    // 1. Generate new market prices
    const leaveout =
      state.timeLeft <= 2
        ? GAME_CONSTANTS.MARKET_LEAVEOUT_ENDGAME // Last 2 days: show all items
        : GAME_CONSTANTS.MARKET_LEAVEOUT_NORMAL; // Normal: hide 3 items

    state.marketPrices = priceGenerator.generatePrices(leaveout);

    // 2. Generate new stock prices
    if (!Array.isArray(state.stockPrices) || state.stockPrices.length === 0) {
      state.stockPrices = stockPriceGenerator.generateInitialPrices();
    }
    state.stockPrices = stockPriceGenerator.generateNextPrices(state.stockPrices);

    // 3. Update finances
    this.handleCashAndDebt(state);

    // 4. Trigger commercial events (0-3 events)
    const commercialEvents = eventSystem.triggerCommercialEvents(state);
    events.push(...commercialEvents);

    // 5. Trigger stock events (0-1 event)
    const stockEvents = eventSystem.triggerStockEvents(state);
    events.push(...stockEvents);
    this.recordStockHistory(state);

    // 6. Trigger health events (0-1 event)
    const healthEvents = eventSystem.triggerHealthEvents(state);
    events.push(...healthEvents);

    // 7. Trigger theft events (0-1 event)
    const theftEvents = eventSystem.triggerTheftEvents(state);
    events.push(...theftEvents);

    // 8. Check debt penalty
    const debtPenalty = eventSystem.checkDebtPenalty(state);
    if (debtPenalty) {
      events.push(debtPenalty);
    }

    // 9. Update location and decrement time
    state.currentLocation = newLocation;
    state.city = newLocation.city;
    state.timeLeft--;

    // 10. Check if game over (time ran out)
    // CRITICAL: Use <= 0 to catch negative values (in case of bugs)
    if (state.timeLeft <= 0) {
      // Auto-liquidate all inventory at current market prices
      const cashBefore = state.cash;
      const itemRevenue = this.forceSellAllItems(state);
      const stockRevenue = this.forceLiquidateStocks(state);
      const liquidationRevenue = state.cash - cashBefore;

      // Return game over event with liquidation info
      events.push({
        type: 'game_over',
        message: `40天已到！\n自动卖出所有商品与股票，获得¥${liquidationRevenue.toLocaleString('zh-CN')}`,
        data: {
          liquidationRevenue,
          itemRevenue,
          stockRevenue,
          finalScore: this.calculateScore(state),
        },
      });

      return events;
    }

    // 11. Check if game over (health depleted)
    if (state.health <= 0) {
      events.push({
        type: 'game_over',
        message: '你倒下了！游戏结束。',
        sound: 'death.wav',
        data: { finalScore: this.calculateScore(state), reason: 'health' },
      });
      return events;
    }

    // 12. Check end game warning (ensure it is shown first)
    const endGameWarning = eventSystem.getEndGameWarning(state);
    if (endGameWarning) {
      const warningEvent: GameEvent = {
        type: 'commercial',
        message: endGameWarning,
        data: { isEndgameWarning: true },
      };
      return [warningEvent, ...events];
    }

    return events;
  }

  /**
   * Handle cash and debt compound interest
   */
  private handleCashAndDebt(state: GameState): void {
    // Debt compounds at 10% per turn
    state.debt = Math.floor(state.debt + state.debt * GAME_CONSTANTS.DEBT_INTEREST_RATE);

    // Bank earns 1% interest per turn
    state.bank = Math.floor(state.bank + state.bank * GAME_CONSTANTS.BANK_INTEREST_RATE);

    // Ensure cash doesn't go negative
    if (state.cash < 0) {
      state.cash = 0;
    }
  }

  /**
   * Deposit money into bank
   */
  depositBank(state: GameState, amount: number): Result<void> {
    if (amount <= 0) {
      return Err('存款金额必须大于0');
    }

    if (amount > state.cash) {
      return Err(`现金不足！你只有¥${state.cash.toLocaleString('zh-CN')}`);
    }

    state.cash -= amount;
    state.bank += amount;

    return Ok(undefined);
  }

  /**
   * Withdraw money from bank
   */
  withdrawBank(state: GameState, amount: number): Result<void> {
    if (amount <= 0) {
      return Err('取款金额必须大于0');
    }

    if (amount > state.bank) {
      return Err(`存款不足！你只有¥${state.bank.toLocaleString('zh-CN')}`);
    }

    state.bank -= amount;
    state.cash += amount;

    return Ok(undefined);
  }

  /**
   * Pay off debt
   */
  payDebt(state: GameState, amount: number): Result<void> {
    if (amount <= 0) {
      return Err('还款金额必须大于0');
    }

    const totalAvailable = state.cash + state.bank;
    if (amount > totalAvailable) {
      return Err(`资金不足！你总共只有¥${totalAvailable.toLocaleString('zh-CN')}`);
    }

    // Use cash first, then bank
    if (amount <= state.cash) {
      state.cash -= amount;
    } else {
      const bankAmount = amount - state.cash;
      state.cash = 0;
      state.bank -= bankAmount;
    }

    state.debt -= amount;
    if (state.debt < 0) {
      state.debt = 0;
    }

    return Ok(undefined);
  }

  /**
   * Visit hospital to restore health
   */
  visitHospital(state: GameState, healthPoints: number): Result<void> {
    if (healthPoints <= 0) {
      return Err('恢复点数必须大于0');
    }

    if (state.health >= GAME_CONSTANTS.MAX_HEALTH) {
      return Err('你的健康已经满了');
    }

    const maxRestore = GAME_CONSTANTS.MAX_HEALTH - state.health;
    if (healthPoints > maxRestore) {
      return Err(`最多只能恢复${maxRestore}点健康`);
    }

    const cost = healthPoints * GAME_CONSTANTS.HOSPITAL_COST_PER_HP;
    if (state.cash < cost) {
      return Err(`现金不足！需要¥${cost.toLocaleString('zh-CN')}，你只有¥${state.cash.toLocaleString('zh-CN')}`);
    }

    state.cash -= cost;
    state.health += healthPoints;

    return Ok(undefined);
  }

  /**
   * Rent house to increase capacity
   *
   * CRITICAL: Two-tier pricing system to balance game economy
   * - Poor players (≤30k): Fixed 25,000 cost
   * - Rich players (>30k): Variable cost = (cash/2 - 2,000)
   * This prevents rich players from exploiting cheap housing
   */
  rentHouse(state: GameState): Result<number> {
    if (state.capacity >= GAME_CONSTANTS.MAX_CAPACITY) {
      return Err(`容量已达上限${GAME_CONSTANTS.MAX_CAPACITY}`);
    }

    // Two-tier pricing system
    let cost: number;
    if (state.cash <= 30000) {
      // Poor players: Fixed cost
      cost = 25000;
    } else {
      // Rich players: Pay half their cash minus 2,000
      cost = Math.floor(state.cash / 2) - 2000;
    }

    if (state.cash < cost) {
      return Err(`现金不足！需要¥${cost.toLocaleString('zh-CN')}，你只有¥${state.cash.toLocaleString('zh-CN')}`);
    }

    state.cash -= cost;
    state.capacity += GAME_CONSTANTS.HOUSE_CAPACITY_INCREASE;

    return Ok(cost);
  }

  /**
   * Visit internet cafe (wangba)
   */
  visitWangba(state: GameState, rewardRange?: { min: number; max: number }): Result<number> {
    if (state.wangbaVisits >= GAME_CONSTANTS.MAX_WANGBA_VISITS) {
      return Err(`你已经访问了${GAME_CONSTANTS.MAX_WANGBA_VISITS}次网吧，不能再去了`);
    }

    if (state.cash < GAME_CONSTANTS.WANGBA_ENTRY_COST) {
      return Err(`现金不足！需要¥${GAME_CONSTANTS.WANGBA_ENTRY_COST}`);
    }

    // Pay entry cost
    state.cash -= GAME_CONSTANTS.WANGBA_ENTRY_COST;
    state.wangbaVisits++;

    const minReward = rewardRange?.min ?? GAME_CONSTANTS.WANGBA_REWARD_MIN;
    const maxReward = rewardRange?.max ?? GAME_CONSTANTS.WANGBA_REWARD_MAX;

    // Random reward within range
    let reward =
      minReward + Math.floor(Math.random() * (maxReward - minReward + 1));

    if (state.hackingEnabled) {
      reward = Math.floor(reward * GAME_CONSTANTS.WANGBA_HACKING_MULTIPLIER);
    }

    state.cash += reward;

    return Ok(reward);
  }

  getGameOverEvent(state: GameState): GameEvent {
    if (state.timeLeft <= 0) {
      return {
        type: 'game_over',
        message: '40天已到！游戏结束。',
        data: { finalScore: this.calculateScore(state), reason: 'time' },
      };
    }

    if (state.health <= 0) {
      return {
        type: 'game_over',
        message: '你倒下了！游戏结束。',
        sound: 'death.wav',
        data: { finalScore: this.calculateScore(state), reason: 'health' },
      };
    }

    return {
      type: 'game_over',
      message: '游戏结束。',
      data: { finalScore: this.calculateScore(state) },
    };
  }

  /**
   * Calculate final score
   * Score = Cash + Bank + StockValue - Debt
   */
  calculateScore(state: GameState): number {
    return state.cash + state.bank + this.calculateStockValue(state) - state.debt;
  }

  /**
   * Calculate total stock value at current prices
   */
  calculateStockValue(state: GameState): number {
    if (!Array.isArray(state.stockPrices) || !Array.isArray(state.stockHoldings)) {
      return 0;
    }

    return state.stockHoldings.reduce((sum, holding) => {
      const price = state.stockPrices[holding.id] ?? 0;
      return sum + price * holding.shares;
    }, 0);
  }

  private recordStockHistory(state: GameState): void {
    if (!Array.isArray(state.stockHistory)) {
      state.stockHistory = state.stockPrices.map((price) => [
        { open: price, high: price, low: price, close: price },
      ]);
      return;
    }

    for (let i = 0; i < state.stockPrices.length; i++) {
      const history = Array.isArray(state.stockHistory[i])
        ? state.stockHistory[i]
        : [];
      const previous = history.length > 0 ? history[history.length - 1] : null;
      const open =
        previous && typeof previous === 'object' && 'close' in previous
          ? (previous as StockCandle).close
          : state.stockPrices[i];
      const close = state.stockPrices[i];

      history.push(stockPriceGenerator.buildCandle(i, open, close));
      if (history.length > GAME_CONSTANTS.STOCK_HISTORY_LENGTH) {
        history.splice(0, history.length - GAME_CONSTANTS.STOCK_HISTORY_LENGTH);
      }
      state.stockHistory[i] = history;
    }
  }

  /**
   * Force sell all inventory (end game liquidation)
   */
  forceSellAllItems(state: GameState): number {
    // Make all items available for selling
    state.marketPrices = priceGenerator.generatePrices(0);

    // Sell everything
    let revenue = 0;
    for (let i = 0; i < 8; i++) {
      const item = state.inventory[i];
      if (item.quantity > 0 && state.marketPrices[i] > 0) {
        const itemRevenue = state.marketPrices[i] * item.quantity;
        state.cash += itemRevenue;
        revenue += itemRevenue;
        item.quantity = 0;
        item.id = -1;
        item.avgPrice = 0;
      }
    }

    return revenue;
  }

  /**
   * Liquidate all stock holdings at current prices
   */
  forceLiquidateStocks(state: GameState): number {
    if (!Array.isArray(state.stockHoldings) || !Array.isArray(state.stockPrices)) {
      return 0;
    }

    let revenue = 0;
    for (const holding of state.stockHoldings) {
      if (holding.shares > 0) {
        const price = state.stockPrices[holding.id] ?? 0;
        const stockRevenue = price * holding.shares;
        state.cash += stockRevenue;
        revenue += stockRevenue;
        holding.shares = 0;
        holding.avgPrice = 0;
      }
    }

    return revenue;
  }

  /**
   * Check if player can afford an item
   */
  getMaxAffordable(state: GameState, drugId: number): number {
    const price = state.marketPrices[drugId];
    if (price === 0) return 0;

    const maxByCash = Math.floor(state.cash / price);
    const currentItems = state.inventory.reduce((sum, item) => sum + item.quantity, 0);
    const maxByCapacity = state.capacity - currentItems;

    return Math.min(maxByCash, maxByCapacity);
  }

  /**
   * Get profit/loss for selling an item
   */
  calculateProfit(state: GameState, drugId: number, quantity: number): number {
    const item = state.inventory[drugId];
    const currentPrice = state.marketPrices[drugId];
    const purchasePrice = item.avgPrice;

    return (currentPrice - purchasePrice) * quantity;
  }
}

// Export singleton instance
export const gameEngine = new GameEngine();
