/**
 * Game State Manager - Observable state management with persistence
 * Pure TypeScript implementation (no external state library)
 *
 * Features:
 * - Observable pattern (subscribe/notify)
 * - Immutable state updates
 * - localStorage persistence
 * - Export/import save files
 * - Auto-save on state changes
 */

import type { GameEvent, GameState, Location } from '@engine/types';
import { BEIJING_LOCATIONS, DRUGS, GAME_CONSTANTS } from '@engine/types';
import { gameEngine } from '@engine/GameEngine';
import { audioManager } from '@audio/AudioManager';
import { priceGenerator } from '@engine/PriceGenerator';
import { trackEvent } from '@utils/analytics';

type StateListener = (state: GameState) => void;

interface SaveData {
  version: string;
  timestamp: number;
  state: GameState;
}

const SAVE_KEY = 'beijing-fushengji-save';
const SAVE_VERSION = '1.0.0';

export class GameStateManager {
  private state: GameState;
  private listeners: Set<StateListener> = new Set();

  constructor(initialState?: GameState) {
    this.state = initialState || this.createInitialState();
  }

  /**
   * Create initial game state
   */
  private createInitialState(): GameState {
    const startingLocation =
      BEIJING_LOCATIONS[Math.floor(Math.random() * BEIJING_LOCATIONS.length)];

    return {
      // Financial
      cash: GAME_CONSTANTS.STARTING_CASH,
      debt: GAME_CONSTANTS.STARTING_DEBT,
      bank: GAME_CONSTANTS.STARTING_BANK,

      // Character
      health: GAME_CONSTANTS.STARTING_HEALTH,
      fame: GAME_CONSTANTS.STARTING_FAME,
      playerName: '',

      // Inventory (8 empty slots)
      inventory: Array(8)
        .fill(null)
        .map(() => ({
          id: -1,
          quantity: 0,
          avgPrice: 0,
        })),
      capacity: GAME_CONSTANTS.STARTING_CAPACITY,

      // World
      currentLocation: startingLocation,
      city: startingLocation.city,
      timeLeft: GAME_CONSTANTS.STARTING_TIME,

      // Market (generate initial prices - normal leaveout of 3)
      marketPrices: priceGenerator.generatePrices(GAME_CONSTANTS.MARKET_LEAVEOUT_NORMAL),

      // Flags
      soundEnabled: true,
      hackingEnabled: false,
      wangbaVisits: 0,
    };
  }

  /**
   * Get current state (returns copy for immutability)
   */
  getState(): GameState {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Update state (immutable)
   */
  setState(updates: Partial<GameState>): void {
    this.state = { ...this.state, ...updates };

    // Sync audio manager with sound settings
    if ('soundEnabled' in updates) {
      audioManager.setSoundEnabled(updates.soundEnabled!);
      trackEvent('toggle_sound', { enabled: updates.soundEnabled ? 1 : 0 });
    }

    if ('hackingEnabled' in updates) {
      trackEvent('toggle_hacking', { enabled: updates.hackingEnabled ? 1 : 0 });
    }

    this.notifyListeners();
    this.autoSave();
  }

  /**
   * Subscribe to state changes
   * Returns unsubscribe function
   */
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    // Call immediately with current state
    listener(this.getState());

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const stateCopy = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(stateCopy);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  /**
   * Auto-save to localStorage (debounced in practice)
   */
  private autoSave(): void {
    // Auto-save every state change
    // In production, this could be debounced to reduce localStorage writes
    this.saveGame();
  }

  /**
   * Save game to localStorage
   */
  saveGame(): void {
    try {
      const saveData: SaveData = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        state: this.state,
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    } catch (error) {
      console.error('Failed to save game:', error);
      // localStorage quota exceeded or disabled
    }
  }

  /**
   * Load game from localStorage
   */
  loadGame(): boolean {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (!saved) return false;

      const saveData: SaveData = JSON.parse(saved);

      // Version check
      if (saveData.version !== SAVE_VERSION) {
        console.warn(`Save version mismatch: ${saveData.version} vs ${SAVE_VERSION}`);
        // Could implement migration logic here
        return false;
      }

      this.state = saveData.state;
      if (typeof (this.state as { playerName?: string }).playerName !== 'string') {
        this.state.playerName = '';
      }
      this.notifyListeners();
      trackEvent('load_game', { success: 1, save_version: saveData.version });
      return true;
    } catch (error) {
      console.error('Failed to load game:', error);
      return false;
    }
  }

  /**
   * Check if save exists
   */
  hasSavedGame(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /**
   * Delete saved game
   */
  deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  /**
   * Export save as JSON string (for backup)
   */
  exportSave(): string {
    const saveData: SaveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      state: this.state,
    };
    return JSON.stringify(saveData, null, 2);
  }

  /**
   * Import save from JSON string
   */
  importSave(saveJson: string): boolean {
    try {
      const saveData: SaveData = JSON.parse(saveJson);

      // Validate structure
      if (!saveData.version || !saveData.state) {
        return false;
      }

      // Version check
      if (saveData.version !== SAVE_VERSION) {
        console.warn(`Save version mismatch: ${saveData.version} vs ${SAVE_VERSION}`);
        return false;
      }

      this.state = saveData.state;
      this.notifyListeners();
      this.saveGame();
      return true;
    } catch (error) {
      console.error('Failed to import save:', error);
      return false;
    }
  }

  /**
   * Reset game (new game)
   */
  resetGame(): void {
    this.state = this.createInitialState();
    trackEvent('new_game');
    this.notifyListeners();
    this.saveGame();
  }

  /**
   * Set player name
   */
  setPlayerName(name: string): void {
    const trimmed = Array.from(name.trim()).slice(0, 8).join('');
    this.state.playerName = trimmed;
    trackEvent('set_player_name', { length: Array.from(trimmed).length });
    this.notifyListeners();
    this.saveGame();
  }

  // ========================================================================
  // Game Actions (delegate to GameEngine)
  // ========================================================================

  /**
   * Buy drug
   */
  buyDrug(drugId: number, quantity: number) {
    const price = this.state.marketPrices[drugId];
    const totalCost = price * quantity;
    const drugName = DRUGS[drugId]?.name ?? `item_${drugId}`;

    const result = gameEngine.buyDrug(this.state, drugId, quantity);
    if (result.success) {
      trackEvent('buy_item', {
        item_id: drugId,
        item_name: drugName,
        quantity,
        price,
        value: totalCost,
        currency: 'CNY',
        city: this.state.city,
      });
      this.notifyListeners();
      this.autoSave();
    }
    return result;
  }

  /**
   * Sell drug
   */
  sellDrug(drugId: number, quantity: number) {
    const price = this.state.marketPrices[drugId];
    const revenue = price * quantity;
    const drugName = DRUGS[drugId]?.name ?? `item_${drugId}`;

    const result = gameEngine.sellDrug(this.state, drugId, quantity);
    if (result.success) {
      trackEvent('sell_item', {
        item_id: drugId,
        item_name: drugName,
        quantity,
        price,
        value: revenue,
        currency: 'CNY',
        city: this.state.city,
      });
      this.notifyListeners();
      this.autoSave();
    }
    return result;
  }

  /**
   * Change location (triggers main game loop)
   */
  changeLocation(location: Location): GameEvent[] {
    const isLocalTravel = location.city === this.state.city;
    const subwayCost = this.state.city === 'beijing'
      ? GAME_CONSTANTS.SUBWAY_TRAVEL_COST_BEIJING
      : GAME_CONSTANTS.SUBWAY_TRAVEL_COST_SHANGHAI;
    const travelCost = isLocalTravel
      ? subwayCost
      : GAME_CONSTANTS.FLIGHT_TRAVEL_COST;

    if (this.state.cash < travelCost) {
      const travelLabel = isLocalTravel ? '地铁' : '机票';
      const events: GameEvent[] = [
        {
          type: 'commercial',
          message: `现金不足，${travelLabel}需要¥${travelCost.toLocaleString('zh-CN')}。`,
          data: { travelBlocked: true }
        }
      ];
      return events;
    }

    // Deduct travel cost
    this.state.cash -= travelCost;

    // Play door close sound on location change
    audioManager.play('door_close');

    const events = gameEngine.changeLocation(this.state, location);
    const eventCount = Array.isArray(events) ? events.length : 0;
    trackEvent('change_location', {
      location_id: location.id,
      location_name: location.name,
      city: location.city,
      travel_cost: travelCost,
      travel_type: isLocalTravel ? 'subway' : 'flight',
      events_count: eventCount,
      time_left: this.state.timeLeft,
    });
    this.notifyListeners();
    this.autoSave();
    return events;
  }

  /**
   * Deposit to bank
   */
  depositBank(amount: number) {
    const result = gameEngine.depositBank(this.state, amount);
    if (result.success) {
      trackEvent('bank_deposit', { value: amount, currency: 'CNY' });
      this.notifyListeners();
      this.autoSave();
    }
    return result;
  }

  /**
   * Withdraw from bank
   */
  withdrawBank(amount: number) {
    const result = gameEngine.withdrawBank(this.state, amount);
    if (result.success) {
      trackEvent('bank_withdraw', { value: amount, currency: 'CNY' });
      this.notifyListeners();
      this.autoSave();
    }
    return result;
  }

  /**
   * Pay debt
   */
  payDebt(amount: number) {
    const result = gameEngine.payDebt(this.state, amount);
    if (result.success) {
      trackEvent('pay_debt', { value: amount, currency: 'CNY' });
      this.notifyListeners();
      this.autoSave();
    }
    return result;
  }

  /**
   * Visit hospital
   */
  visitHospital(healthPoints: number) {
    const totalCost = healthPoints * GAME_CONSTANTS.HOSPITAL_COST_PER_HP;
    const result = gameEngine.visitHospital(this.state, healthPoints);
    if (result.success) {
      trackEvent('visit_hospital', {
        health_points: healthPoints,
        value: totalCost,
        currency: 'CNY',
      });
      this.notifyListeners();
      this.autoSave();
    }
    return result;
  }

  /**
   * Rent house
   */
  rentHouse() {
    const result = gameEngine.rentHouse(this.state);
    if (result.success) {
      trackEvent('rent_house', {
        value: result.value,
        currency: 'CNY',
        capacity: this.state.capacity,
      });
      this.notifyListeners();
      this.autoSave();
    }
    return result;
  }

  /**
   * Visit wangba
   */
  visitWangba(minReward?: number, maxReward?: number) {
    const rewardRange =
      typeof minReward === 'number' && typeof maxReward === 'number'
        ? { min: minReward, max: maxReward }
        : undefined;
    const result = gameEngine.visitWangba(this.state, rewardRange);
    if (result.success) {
      trackEvent('visit_wangba', {
        reward: result.value,
        entry_cost: GAME_CONSTANTS.WANGBA_ENTRY_COST,
        hacking_enabled: this.state.hackingEnabled ? 1 : 0,
        min_reward: rewardRange?.min ?? GAME_CONSTANTS.WANGBA_REWARD_MIN,
        max_reward: rewardRange?.max ?? GAME_CONSTANTS.WANGBA_REWARD_MAX,
        visits: this.state.wangbaVisits,
      });
      this.notifyListeners();
      this.autoSave();
    }
    return result;
  }

  /**
   * Toggle sound
   */
  toggleSound(): void {
    this.setState({ soundEnabled: !this.state.soundEnabled });
  }

  /**
   * Toggle hacking mode
   */
  toggleHacking(): void {
    this.setState({ hackingEnabled: !this.state.hackingEnabled });
  }

  /**
   * Get max affordable quantity for a drug
   */
  getMaxAffordable(drugId: number): number {
    return gameEngine.getMaxAffordable(this.state, drugId);
  }

  /**
   * Calculate profit/loss for selling
   */
  calculateProfit(drugId: number, quantity: number): number {
    return gameEngine.calculateProfit(this.state, drugId, quantity);
  }

  /**
   * Calculate final score
   */
  calculateScore(): number {
    return gameEngine.calculateScore(this.state);
  }

  /**
   * Force sell all items (end game)
   */
  forceSellAllItems(): void {
    gameEngine.forceSellAllItems(this.state);
    this.notifyListeners();
    this.autoSave();
  }

  /**
   * Check if player is dead
   */
  isDead(): boolean {
    return this.state.health <= 0;
  }

  /**
   * Check if time has run out
   */
  isTimeUp(): boolean {
    return this.state.timeLeft <= 0;
  }

  /**
   * Check if game has ended (either time ran out OR player died)
   */
  isGameOver(): boolean {
    return this.isTimeUp() || this.isDead();
  }
}

/**
 * Create and export global game state manager instance
 */
export function createGameStateManager(): GameStateManager {
  return new GameStateManager();
}

// Export singleton for convenience
export const gameStateManager = createGameStateManager();
