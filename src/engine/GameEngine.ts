/**
 * Game Engine - Core game logic and mechanics
 * Ported from: CSelectionDlg class in SelectionDlg.cpp
 *
 * Handles all game operations:
 * - Trading (buy/sell)
 * - Financial (bank/debt)
 * - Services (hospital/house/wangba)
 * - Location changes and event triggering
 */

import type { GameState, GameEvent, Location, Result } from './types';
import { DRUGS, GAME_CONSTANTS, Ok, Err } from './types';
import { priceGenerator } from './PriceGenerator';
import { eventSystem } from './EventSystem';

export class GameEngine {
  /**
   * Buy a drug
   * Ported from: BuyDlg.cpp
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
   * Ported from: SellDlg.cpp
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
    // Original C++ (lines 883-924): Checks by drug name
    // - "劣质假酒" → fame -= 10 (Drug ID 3)
    // - "上海特色小食" → fame -= 7 (Drug ID 4)
    if (drugId === 3) {
      state.fame -= 10;  // 劣质假酒
      if (state.fame < 0) state.fame = 0;
    } else if (drugId === 4) {
      state.fame -= 7;  // 上海特色小食
      if (state.fame < 0) state.fame = 0;
    }

    return Ok(undefined);
  }

  /**
   * Change location - triggers the core game loop
   * Ported from: HandleNormalEvents() in SelectionDlg.cpp (lines 1447-1550)
   *
   * This is the main game loop that executes on each location change:
   * 1. Generate new market prices
   * 2. Update finances (debt/bank interest)
   * 3. Trigger commercial events
   * 4. Trigger health events
   * 5. Trigger theft events
   * 6. Check debt penalty
   * 7. Update location and decrement time
   * 8. Check game over (time ran out)
   * 9. Check game over (health depleted)
   * 10. Check end game warning (ensure it is shown first)
   */
  changeLocation(state: GameState, newLocation: Location): GameEvent[] {
    const events: GameEvent[] = [];

    // 1. Generate new market prices
    const leaveout =
      state.timeLeft <= 2
        ? GAME_CONSTANTS.MARKET_LEAVEOUT_ENDGAME // Last 2 days: show all items
        : GAME_CONSTANTS.MARKET_LEAVEOUT_NORMAL; // Normal: hide 3 items

    state.marketPrices = priceGenerator.generatePrices(leaveout);

    // 2. Update finances
    this.handleCashAndDebt(state);

    // 3. Trigger commercial events (0-3 events)
    const commercialEvents = eventSystem.triggerCommercialEvents(state);
    events.push(...commercialEvents);

    // 4. Trigger health events (0-1 event)
    const healthEvents = eventSystem.triggerHealthEvents(state);
    events.push(...healthEvents);

    // 5. Trigger theft events (0-1 event)
    const theftEvents = eventSystem.triggerTheftEvents(state);
    events.push(...theftEvents);

    // 6. Check debt penalty
    const debtPenalty = eventSystem.checkDebtPenalty(state);
    if (debtPenalty) {
      events.push(debtPenalty);
    }

    // 7. Update location and decrement time
    state.currentLocation = newLocation;
    state.city = newLocation.city;
    state.timeLeft--;

    // 8. Check if game over (time ran out)
    // CRITICAL: Use <= 0 to catch negative values (in case of bugs)
    if (state.timeLeft <= 0) {
      // Auto-liquidate all inventory at current market prices
      const cashBefore = state.cash;
      this.forceSellAllItems(state);
      const liquidationRevenue = state.cash - cashBefore;

      // Return game over event with liquidation info
      events.push({
        type: 'game_over',
        message: `40天已到！\n自动卖出所有商品，获得¥${liquidationRevenue.toLocaleString('zh-CN')}`,
        data: { liquidationRevenue, finalScore: this.calculateScore(state) },
      });

      return events;
    }

    // 9. Check if game over (health depleted)
    if (state.health <= 0) {
      events.push({
        type: 'game_over',
        message: '你倒下了！游戏结束。',
        sound: 'death.wav',
        data: { finalScore: this.calculateScore(state), reason: 'health' },
      });
      return events;
    }

    // 10. Check end game warning (ensure it is shown first)
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
   * Ported from: HandleNormalEvents() in SelectionDlg.cpp
   *
   * Original C++:
   * MyDebt = MyDebt + MyDebt * 0.10;  // 10% compound
   * MyBank = MyBank + MyBank * 0.01;  // 1% interest
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
   * Ported from: EnterBank.cpp
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
   * Ported from: EnterBank.cpp
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
   * Ported from: Post office logic
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
   * Ported from: Hispital.cpp
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
   * Ported from: SelectionDlg.cpp lines 2085-2093
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

    // Two-tier pricing system (matches original C++ exactly)
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
   * Ported from: Wangba.cpp
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
   * Score = Cash + Bank - Debt
   */
  calculateScore(state: GameState): number {
    return state.cash + state.bank - state.debt;
  }

  /**
   * Force sell all inventory (end game liquidation)
   * Ported from: End game logic in SelectionDlg.cpp
   */
  forceSellAllItems(state: GameState): void {
    // Make all items available for selling
    state.marketPrices = priceGenerator.generatePrices(0);

    // Sell everything
    for (let i = 0; i < 8; i++) {
      const item = state.inventory[i];
      if (item.quantity > 0 && state.marketPrices[i] > 0) {
        const revenue = state.marketPrices[i] * item.quantity;
        state.cash += revenue;
        item.quantity = 0;
        item.id = -1;
        item.avgPrice = 0;
      }
    }
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
