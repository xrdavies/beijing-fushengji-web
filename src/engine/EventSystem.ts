/**
 * Event System - Random event triggering and handling
 * Ported from: HandleNormalEvents() and related functions in SelectionDlg.cpp
 *
 * Handles three types of random events:
 * 1. Commercial Events - Market price changes, free items
 * 2. Health Events - Player health damage
 * 3. Theft Events - Money loss
 */

import type { GameState, GameEvent, CommercialEvent, TheftEvent } from './types';
import { COMMERCIAL_EVENTS, HEALTH_EVENTS, THEFT_EVENTS } from './events';
import { GAME_CONSTANTS } from './types';
import { randomInt } from '@utils/random';

export class EventSystem {
  /**
   * Trigger commercial events (0-3 events per turn)
   * Ported from: doRandomStuff() in SelectionDlg.cpp
   *
   * Original algorithm:
   * - For each event, check: if (random(950) % event.freq === 0)
   * - If triggered, apply price change or give free items
   */
  triggerCommercialEvents(state: GameState): GameEvent[] {
    const events: GameEvent[] = [];

    for (const event of COMMERCIAL_EVENTS) {
      // Weighted random selection based on frequency
      // Lower freq = more common (e.g., freq=17 triggers more often than freq=190)
      if (randomInt(950) % event.freq === 0) {
        events.push(this.applyCommercialEvent(state, event));
      }
    }

    return events;
  }

  /**
   * Apply a single commercial event
   */
  private applyCommercialEvent(state: GameState, event: CommercialEvent): GameEvent {
    const drugId = event.drug;

    // Apply price multiplier
    if (event.plus > 0 && state.marketPrices[drugId] > 0) {
      state.marketPrices[drugId] *= event.plus;
    }

    // Apply price divisor
    if (event.minus > 0 && state.marketPrices[drugId] > 0) {
      state.marketPrices[drugId] = Math.floor(state.marketPrices[drugId] / event.minus);
      if (state.marketPrices[drugId] < 1) state.marketPrices[drugId] = 1;
    }

    // Give free items
    if (event.add > 0) {
      const currentItem = state.inventory[drugId];
      const totalItems = state.inventory.reduce((sum, item) => sum + item.quantity, 0);

      // Check if player has capacity
      if (totalItems + event.add <= state.capacity) {
        currentItem.quantity += event.add;
        // Set average price to 0 for free items (or keep existing avg if already owned)
        if (currentItem.quantity === event.add) {
          currentItem.avgPrice = 0;
        }
      }
    }

    // Special case: Event 17 adds debt
    // Original C++: if (event index == 17) m_pDlg->MyDebt += 2500;
    if (COMMERCIAL_EVENTS.indexOf(event) === 17) {
      state.debt += 2500;
    }

    return {
      type: 'commercial',
      message: event.msg,
      data: { drugId, plus: event.plus, minus: event.minus, add: event.add }
    };
  }

  /**
   * Trigger health events (0-1 event per turn)
   * Ported from: doRandomEvent() in SelectionDlg.cpp
   *
   * Original algorithm:
   * - For each event, check: if (random(1000) % event.freq === 0)
   * - If triggered, reduce health and play sound
   * - Check for auto-hospitalization if health < 85
   */
  triggerHealthEvents(state: GameState): GameEvent[] {
    const events: GameEvent[] = [];

    for (const event of HEALTH_EVENTS) {
      // Weighted random selection
      if (randomInt(1000) % event.freq === 0) {
        // Apply health damage
        state.health -= event.hunt;
        if (state.health < 0) state.health = 0;

        events.push({
          type: 'health',
          message: event.msg,
          sound: event.sound,
          data: { damage: event.hunt, newHealth: state.health }
        });

        // Only one health event per turn
        break;
      }
    }

    // Check for auto-hospitalization
    // Original C++: if (health < 85 && timeLeft > 3)
    if (
      state.health < GAME_CONSTANTS.AUTO_HOSPITAL_HEALTH_THRESHOLD &&
      state.timeLeft > GAME_CONSTANTS.AUTO_HOSPITAL_MIN_TIME
    ) {
      const autoHospitalEvent = this.autoHospitalize(state);
      if (autoHospitalEvent) {
        events.push(autoHospitalEvent);
      }
    }

    return events;
  }

  /**
   * Auto-hospitalization when health is critically low
   * Ported from: SelectionDlg.cpp auto-hospital logic
   */
  private autoHospitalize(state: GameState): GameEvent | null {
    // Random 1-2 days
    const days = GAME_CONSTANTS.AUTO_HOSPITAL_DAYS_MIN + randomInt(2);

    // Random cost: 1000-9500 yuan per day
    const costPerDay =
      GAME_CONSTANTS.AUTO_HOSPITAL_COST_MIN +
      randomInt(GAME_CONSTANTS.AUTO_HOSPITAL_COST_MAX - GAME_CONSTANTS.AUTO_HOSPITAL_COST_MIN);
    const totalCost = days * costPerDay;

    // Add to debt
    state.debt += totalCost;

    // Restore health by +10 (not full restore) - matching C++ line 1617
    state.health += 10;
    if (state.health > GAME_CONSTANTS.MAX_HEALTH) {
      state.health = GAME_CONSTANTS.MAX_HEALTH;
    }

    // Lose time in hospital - matching C++ line 1620
    state.timeLeft -= days;

    return {
      type: 'auto_hospital',
      message: `你的健康状况太差，被强制送往医院治疗${days}天，花费¥${totalCost.toLocaleString('zh-CN')}（已计入债务）`,
      data: { days, cost: totalCost }
    };
  }

  /**
   * Trigger theft events (0-1 event per turn)
   * Ported from: onSteal() in SelectionDlg.cpp
   *
   * Original algorithm:
   * - For each eve, check: if (random(1000) % event.freq === 0)
   * - If triggered, reduce cash or bank by percentage
   */
  triggerTheftEvents(state: GameState): GameEvent[] {
    const events: GameEvent[] = [];

    for (const event of THEFT_EVENTS) {
      // Weighted random selection
      if (randomInt(1000) % event.freq === 0) {
        const lossAmount = this.applyTheftEvent(state, event);

        events.push({
          type: 'theft',
          message: event.msg,
          data: { ratio: event.ratio, lossAmount }
        });

        // Only one theft event per turn
  break;
      }
    }

    // Check for hacker event (if enabled)
    if (state.hackingEnabled) {
      const hackerEvent = this.triggerHackerEvent(state);
      if (hackerEvent) {
        events.push(hackerEvent);
      }
    }

    return events;
  }

  /**
   * Apply a single theft event
   * Ported from: SelectionDlg.cpp lines 1791-1807
   */
  private applyTheftEvent(state: GameState, event: TheftEvent): number {
    // Events 4 and 5 affect bank, others affect cash (C++ line 1791)
    const eventIndex = THEFT_EVENTS.indexOf(event);
    const affectsBank = (eventIndex === 4 || eventIndex === 5);

    if (affectsBank && state.bank > 0) {
      // Telecom fraud - affects bank (C++ line 1807)
      const oldBank = state.bank;
      state.bank = Math.floor((state.bank / 100) * (100 - event.ratio));
      if (state.bank < 0) state.bank = 0;
      return oldBank - state.bank;
    } else if (!affectsBank) {
      // Other theft events - affect cash (C++ line 1796)
      const oldCash = state.cash;
      state.cash = Math.floor((state.cash / 100) * (100 - event.ratio));
      if (state.cash < 0) state.cash = 0;
      return oldCash - state.cash;
    }

    return 0;
  }

  /**
   * Hacker event (if hacking mode enabled)
   * Ported from: SelectionDlg.cpp lines 1814-1850
   *
   * Three-tier logic based on bank balance:
   * 1. Bank < 1000: No effect (too little to hack)
   * 2. Bank 1000-100000: Always gain (help poor players)
   * 3. Bank > 100000: 33% gain / 67% lose (rich players at risk)
   */
  private triggerHackerEvent(state: GameState): GameEvent | null {
    // 2.5% chance (1000 % 25 === 0)
    if (randomInt(1000) % 25 !== 0) {
      return null;
    }

    // Bank < 1000: do nothing (C++ line 1817)
    if (state.bank < 1000) {
      return null;
    }

    let amount: number;
    let isGain: boolean;
    let message: string;

    if (state.bank > 100000) {
      // Rich players: High risk/reward (C++ lines 1819-1837)
      // Divisor: [2-21], amount: 4.76%-50% of bank
      amount = Math.floor(state.bank / (2 + randomInt(20)));

      // 67% chance to lose, 33% chance to gain
      if (randomInt(20) % 3 !== 0) {
        // Lose money
        state.bank -= amount;
        if (state.bank < 0) state.bank = 0;
        isGain = false;
        message = `你的银行账户遭遇黑客入侵，修改了数据库，你的存款减少了¥${amount.toLocaleString('zh-CN')}！`;
      } else {
        // Gain money
        state.bank += amount;
        isGain = true;
        message = `你的黑客技术修改了银行数据库，你的存款增加了¥${amount.toLocaleString('zh-CN')}！`;
      }
    } else {
      // Poor players: Always gain (C++ lines 1840-1847)
      // Divisor: [1-15], amount: 6.67%-100% of bank
      amount = Math.floor(state.bank / (1 + randomInt(15)));
      state.bank += amount;
      isGain = true;
      message = `你的黑客技术修改了银行数据库，你的存款增加了¥${amount.toLocaleString('zh-CN')}！`;
    }

    return {
      type: 'theft',
      message,
      data: { isHacker: true, isGain, amount }
    };
  }

  /**
   * Check for debt penalty (debt > 100k)
   * Ported from: SelectionDlg.cpp debt penalty check
   *
   * Original C++:
   * if (MyDebt > 100000) {
   *   m_nMyHealth -= 30;
   *   PlaySound("kill.wav");
   * }
   */
  checkDebtPenalty(state: GameState): GameEvent | null {
    if (state.debt > GAME_CONSTANTS.DEBT_PENALTY_THRESHOLD) {
      state.health -= GAME_CONSTANTS.DEBT_PENALTY_DAMAGE;
      if (state.health < 0) state.health = 0;

      return {
        type: 'debt_penalty',
        message: `你的债务超过¥${GAME_CONSTANTS.DEBT_PENALTY_THRESHOLD.toLocaleString('zh-CN')}，债主派人来教训你！你损失了${GAME_CONSTANTS.DEBT_PENALTY_DAMAGE}点健康！`,
        sound: 'kill.wav',
        data: { damage: GAME_CONSTANTS.DEBT_PENALTY_DAMAGE }
      };
    }

    return null;
  }

  /**
   * Get end game warning message (day 39)
   */
  getEndGameWarning(state: GameState): string | null {
    if (state.timeLeft === GAME_CONSTANTS.ENDGAME_WARNING_DAY) {
      return '最后一天了！赶快抛售你的货物吧！';
    }
    return null;
  }
}

// Export singleton instance
export const eventSystem = new EventSystem();
