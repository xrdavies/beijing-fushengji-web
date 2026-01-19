/**
 * Core type definitions for Beijing Fushengji game engine
 * Ported from original C++ codebase
 */

// ============================================================================
// Drug/Item System
// ============================================================================

export interface DrugItem {
  id: number;           // Drug ID (0-7)
  quantity: number;     // Current quantity owned
  avgPrice: number;     // Average purchase price
}

export interface DrugInfo {
  id: number;
  name: string;         // Chinese name
  minPrice: number;     // Minimum market price (inclusive)
  maxPrice: number;     // Maximum market price (exclusive upper bound - actual max is maxPrice-1)
}

// The 8 tradeable goods
// Drug names from original C++ game
export const DRUGS: DrugInfo[] = [
  { id: 0, name: '古董瓷器', minPrice: 100, maxPrice: 450 },
  { id: 1, name: '走私电器', minPrice: 15000, maxPrice: 30000 },
  { id: 2, name: '盗版A片', minPrice: 5, maxPrice: 55 },
  { id: 3, name: '劣质假酒', minPrice: 1000, maxPrice: 3500 },  // FIXED: was 紫砂茶具、古董茶
  { id: 4, name: '上海小宝贝', minPrice: 5000, maxPrice: 14000 },  // FIXED: was 新泻特产、特色小食品
  { id: 5, name: '仿爱马仕', minPrice: 250, maxPrice: 850 },
  { id: 6, name: '越南翡翠手镯', minPrice: 750, maxPrice: 1500 },
  { id: 7, name: '印度神油', minPrice: 65, maxPrice: 245 },  // FIXED: was α街画报纸品
];

// ============================================================================
// Location System
// ============================================================================

export type City = 'beijing' | 'shanghai';

export interface Location {
  id: number;
  name: string;         // Chinese name
  city: City;
}

// Beijing locations (10)
export const BEIJING_LOCATIONS: Location[] = [
  { id: 0, name: '建国门', city: 'beijing' },
  { id: 1, name: '北京站', city: 'beijing' },
  { id: 2, name: '西直门', city: 'beijing' },
  { id: 3, name: '崇文门', city: 'beijing' },
  { id: 4, name: '东直门', city: 'beijing' },
  { id: 5, name: '复兴门', city: 'beijing' },
  { id: 6, name: '积水潭', city: 'beijing' },
  { id: 7, name: '长春街', city: 'beijing' },
  { id: 8, name: '公主坟', city: 'beijing' },
  { id: 9, name: '苹果园', city: 'beijing' },
];

// Shanghai locations (10)
export const SHANGHAI_LOCATIONS: Location[] = [
  { id: 10, name: '东方明珠', city: 'shanghai' },
  { id: 11, name: '浦东新区', city: 'shanghai' },
  { id: 12, name: '外滩', city: 'shanghai' },
  { id: 13, name: '南京路', city: 'shanghai' },
  { id: 14, name: '人民广场', city: 'shanghai' },
  { id: 15, name: '徐家汇', city: 'shanghai' },
  { id: 16, name: '静安寺', city: 'shanghai' },
  { id: 17, name: '虹桥', city: 'shanghai' },
  { id: 18, name: '陆家嘴', city: 'shanghai' },
  { id: 19, name: '豫园', city: 'shanghai' },
];

export const ALL_LOCATIONS = [...BEIJING_LOCATIONS, ...SHANGHAI_LOCATIONS];

// ============================================================================
// Event System
// ============================================================================

/**
 * Commercial Event (Market price changes, free items)
 * Ported from: Message gameMessages[] in SelectionDlg.cpp
 */
export interface CommercialEvent {
  freq: number;         // Frequency weight (lower = more common)
  msg: string;          // Event message (Chinese)
  drug: number;         // Affected drug ID (0-7)
  plus: number;         // Price multiplier (0 if not used)
  minus: number;        // Price divisor (0 if not used)
  add: number;          // Free items given (0 if not used)
}

/**
 * Health Event (Damage to player health)
 * Ported from: BadEvent random_event[] in SelectionDlg.cpp
 */
export interface HealthEvent {
  freq: number;         // Frequency weight
  msg: string;          // Damage message (Chinese)
  hunt: number;         // Health points lost
  sound: string;        // Sound effect filename
}

/**
 * Theft Event (Money loss)
 * Ported from: StealEvent random_steal_event[] in SelectionDlg.cpp
 */
export interface TheftEvent {
  freq: number;         // Frequency weight
  msg: string;          // Theft message (Chinese)
  ratio: number;        // Percentage of cash/bank lost (5-40%)
  fixedLoss?: number;   // Fixed cash loss (optional)
  sound?: string;       // Optional sound effect filename
}

/**
 * Game Event Result (returned after location change)
 */
export interface GameEvent {
  type: 'commercial' | 'health' | 'theft' | 'debt_penalty' | 'auto_hospital' | 'game_over';
  message: string;
  sound?: string;
  data?: any;           // Additional event-specific data
}

// ============================================================================
// Game State
// ============================================================================

export interface GameState {
  // Financial
  cash: number;         // Current cash (MyCash)
  debt: number;         // Current debt (MyDebt) - 10% interest per turn
  bank: number;         // Bank savings (MyBank) - 1% interest per turn

  // Character
  health: number;       // Health points (m_nMyHealth) - max 100
  fame: number;         // Fame/reputation (m_MyFame)

  // Inventory
  inventory: DrugItem[]; // 8 items (m_nMyDrugs[8])
  capacity: number;     // Max items (m_nMyCapacity) - starts at 100, max 140

  // World
  currentLocation: Location | null;  // Current location (m_MyCurrentLoc)
  city: City;           // Current city (m_City)
  timeLeft: number;     // Days remaining (m_nTimeLeft) - starts at 40

  // Market
  marketPrices: number[]; // Current prices for 8 drugs (m_DrugPrice[8])

  // Flags & Counters
  soundEnabled: boolean;
  hackingEnabled: boolean;
  wangbaVisits: number; // Internet cafe visits (max 3)
}

// ============================================================================
// Result Types
// ============================================================================

export type Result<T> =
  | { success: true; value: T }
  | { success: false; error: string };

export function Ok<T>(value: T): Result<T> {
  return { success: true, value };
}

export function Err<T>(error: string): Result<T> {
  return { success: false, error };
}

// ============================================================================
// Constants
// ============================================================================

export const GAME_CONSTANTS = {
  // Starting values
  STARTING_CASH: 2000,
  STARTING_DEBT: 5000,
  STARTING_BANK: 0,
  STARTING_HEALTH: 100,
  STARTING_FAME: 100,
  STARTING_CAPACITY: 100,
  STARTING_TIME: 40,

  // Limits
  MAX_HEALTH: 100,
  MAX_CAPACITY: 140,
  MAX_WANGBA_VISITS: 3,

  // Financial
  DEBT_INTEREST_RATE: 0.10,      // 10% per turn
  BANK_INTEREST_RATE: 0.01,      // 1% per turn
  DEBT_PENALTY_THRESHOLD: 100000, // Debt > 100k triggers penalty
  DEBT_PENALTY_DAMAGE: 30,        // -30 HP

  // Services
  HOSPITAL_COST_PER_HP: 3500,
  HOUSE_RENT_MIN: 25000,          // Poor players (cash ≤ 30k): Fixed cost
  HOUSE_RENT_MAX: 30000,          // Not used (kept for reference)
  HOUSE_RENT_RICH_THRESHOLD: 30000, // Rich players (cash > 30k): Pay (cash/2 - 2000)
  HOUSE_CAPACITY_INCREASE: 10,
  WANGBA_ENTRY_COST: 15,
  WANGBA_REWARD_MIN: 1,
  WANGBA_REWARD_MAX: 10,
  WANGBA_HACKING_MULTIPLIER: 1.5,
  SUBWAY_TRAVEL_COST_BEIJING: 2,
  SUBWAY_TRAVEL_COST_SHANGHAI: 5,
  FLIGHT_TRAVEL_COST: 500,

  // Auto-hospitalization
  AUTO_HOSPITAL_HEALTH_THRESHOLD: 85,
  AUTO_HOSPITAL_MIN_TIME: 3,
  AUTO_HOSPITAL_DAYS_MIN: 1,
  AUTO_HOSPITAL_DAYS_MAX: 2,
  AUTO_HOSPITAL_COST_MIN: 1000,
  AUTO_HOSPITAL_COST_MAX: 9500,

  // Market
  MARKET_LEAVEOUT_NORMAL: 3,     // Hide 3 items normally
  MARKET_LEAVEOUT_ENDGAME: 0,    // Show all items in last 2 days
  ENDGAME_WARNING_DAY: 1,        // Show warning on day 39
};
