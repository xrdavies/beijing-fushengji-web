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

import type { GameState, Location } from '@engine/types';
import { GAME_CONSTANTS } from '@engine/types';
import { gameEngine } from '@engine/GameEngine';
import { audioManager } from '@audio/AudioManager';
import { priceGenerator } from '@engine/PriceGenerator';

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
   * Ported from: CSelectionDlg constructor and OnInitDialog() in SelectionDlg.cpp
   */
  private createInitialState(): GameState {
    return {
      // Financial
      cash: GAME_CONSTANTS.STARTING_CASH,
      debt: GAME_CONSTANTS.STARTING_DEBT,
      bank: GAME_CONSTANTS.STARTING_BANK,

      // Character
      health: GAME_CONSTANTS.STARTING_HEALTH,
      fame: GAME_CONSTANTS.STARTING_FAME,

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
      currentLocation: null,
      city: 'beijing',
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
      this.notifyListeners();
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
    const result = gameEngine.buyDrug(this.state, drugId, quantity);
    if (result.success) {
      this.notifyListeners();
      this.autoSave();
    }
    return result;
  }

  /**
   * Sell drug
   */
  sellDrug(drugId: number, quantity: number) {
    const result = gameEngine.sellDrug(this.state, drugId, quantity);
    if (result.success) {
      this.notifyListeners();
      this.autoSave();
    }
    return result;
  }

  /**
   * Change location (triggers main game loop)
   */
  changeLocation(location: Location) {
    // Play door close sound on location change
    audioManager.play('door_close');

    const events = gameEngine.changeLocation(this.state, location);
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
      this.notifyListeners();
      this.autoSave();
    }
    return result;
  }

  /**
   * Visit hospital
   */
  visitHospital(healthPoints: number) {
    const result = gameEngine.visitHospital(this.state, healthPoints);
    if (result.success) {
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
      this.notifyListeners();
      this.autoSave();
    }
    return result;
  }

  /**
   * Toggle sound
   */
  toggleSound(): void {
    this.state.soundEnabled = !this.state.soundEnabled;
    this.notifyListeners();
    this.autoSave();
  }

  /**
   * Toggle hacking mode
   */
  toggleHacking(): void {
    this.state.hackingEnabled = !this.state.hackingEnabled;
    this.notifyListeners();
    this.autoSave();
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
