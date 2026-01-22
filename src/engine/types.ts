/**
 * Core type definitions for Beijing Fushengji game engine
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

export interface StockHolding {
  id: number;
  shares: number;
  avgPrice: number;
}

export interface StockInfo {
  id: number;
  name: string;         // Chinese name
  startMin: number;     // Initial price range min
  startMax: number;     // Initial price range max
  minPrice: number;     // Hard minimum clamp
  maxPrice: number;     // Hard maximum clamp
  dailyVolatility: number; // Daily noise range (0-1)
  jumpChance: number;      // Chance of jump (0-1)
  jumpMin: number;         // Jump magnitude min (0-1)
  jumpMax: number;         // Jump magnitude max (0-1)
}

export interface StockCandle {
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface StockEvent {
  freq: number;         // Frequency weight
  msg: string;          // Event message (Chinese)
  stock: number;        // Affected stock ID (0-9)
  plus: number;         // Price multiplier (0 if not used)
  minus: number;        // Price divisor (0 if not used)
}

// The 8 tradeable goods
export const DRUGS: DrugInfo[] = [
  { id: 0, name: '二手古玩', minPrice: 100, maxPrice: 450 },
  { id: 1, name: '走私电器', minPrice: 15000, maxPrice: 30000 },
  { id: 2, name: '盗版VCD', minPrice: 5, maxPrice: 55 },
  { id: 3, name: '劣质假酒', minPrice: 1000, maxPrice: 3500 },
  { id: 4, name: '上海小宝贝', minPrice: 5000, maxPrice: 14000 },
  { id: 5, name: '进口玩具', minPrice: 250, maxPrice: 850 },
  { id: 6, name: '越南翡翠手镯', minPrice: 750, maxPrice: 1500 },
  { id: 7, name: '印度神油', minPrice: 65, maxPrice: 245 },
];

// The 10 stock tickers
export const STOCKS: StockInfo[] = [
  {
    id: 0,
    name: '中关村',
    startMin: 1000,
    startMax: 5000,
    minPrice: 300,
    maxPrice: 80000,
    dailyVolatility: 0.12,
    jumpChance: 0.08,
    jumpMin: 0.3,
    jumpMax: 1.2,
  },
  {
    id: 1,
    name: '深鸿基',
    startMin: 800,
    startMax: 4000,
    minPrice: 250,
    maxPrice: 60000,
    dailyVolatility: 0.11,
    jumpChance: 0.08,
    jumpMin: 0.25,
    jumpMax: 0.9,
  },
  {
    id: 2,
    name: '万科地产',
    startMin: 1200,
    startMax: 6000,
    minPrice: 400,
    maxPrice: 90000,
    dailyVolatility: 0.13,
    jumpChance: 0.08,
    jumpMin: 0.3,
    jumpMax: 1.2,
  },
  {
    id: 3,
    name: '广发证券',
    startMin: 1500,
    startMax: 7000,
    minPrice: 500,
    maxPrice: 100000,
    dailyVolatility: 0.12,
    jumpChance: 0.08,
    jumpMin: 0.3,
    jumpMax: 1.2,
  },
  {
    id: 4,
    name: '贵州茅台',
    startMin: 600,
    startMax: 3000,
    minPrice: 200,
    maxPrice: 50000,
    dailyVolatility: 0.1,
    jumpChance: 0.08,
    jumpMin: 0.2,
    jumpMax: 0.8,
  },
  {
    id: 5,
    name: '中国石油',
    startMin: 900,
    startMax: 4500,
    minPrice: 300,
    maxPrice: 70000,
    dailyVolatility: 0.11,
    jumpChance: 0.08,
    jumpMin: 0.25,
    jumpMax: 0.9,
  },
  {
    id: 6,
    name: '航天动力',
    startMin: 1200,
    startMax: 5500,
    minPrice: 400,
    maxPrice: 85000,
    dailyVolatility: 0.13,
    jumpChance: 0.09,
    jumpMin: 0.35,
    jumpMax: 1.2,
  },
  {
    id: 7,
    name: '上海医药',
    startMin: 900,
    startMax: 4800,
    minPrice: 300,
    maxPrice: 75000,
    dailyVolatility: 0.11,
    jumpChance: 0.08,
    jumpMin: 0.3,
    jumpMax: 1.0,
  },
  {
    id: 8,
    name: '华润电力',
    startMin: 1100,
    startMax: 5200,
    minPrice: 350,
    maxPrice: 90000,
    dailyVolatility: 0.14,
    jumpChance: 0.09,
    jumpMin: 0.35,
    jumpMax: 1.2,
  },
  {
    id: 9,
    name: '厦门象屿',
    startMin: 700,
    startMax: 3800,
    minPrice: 250,
    maxPrice: 65000,
    dailyVolatility: 0.1,
    jumpChance: 0.08,
    jumpMin: 0.25,
    jumpMax: 0.9,
  },
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
 */
export interface HealthEvent {
  freq: number;         // Frequency weight
  msg: string;          // Damage message (Chinese)
  hunt: number;         // Health points lost
  sound: string;        // Sound effect filename
}

/**
 * Theft Event (Money loss)
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
  type: 'commercial' | 'health' | 'theft' | 'stock' | 'debt_penalty' | 'auto_hospital' | 'game_over';
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
  playerName: string;   // Player name

  // Inventory
  inventory: DrugItem[]; // 8 items (m_nMyDrugs[8])
  capacity: number;     // Max items (m_nMyCapacity) - starts at 100, max 140

  // World
  currentLocation: Location | null;  // Current location (m_MyCurrentLoc)
  city: City;           // Current city (m_City)
  timeLeft: number;     // Days remaining (m_nTimeLeft) - starts at 40

  // Market
  marketPrices: number[]; // Current prices for 8 drugs (m_DrugPrice[8])

  // Stocks
  stockPrices: number[];     // Current prices for stocks
  stockHoldings: StockHolding[]; // Owned stock positions
  stockHistory: StockCandle[][];  // Recent price history per stock

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
  STOCK_TRADE_FEE_RATE: 0.005,
  STOCK_HISTORY_LENGTH: 25,

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
