/**
 * Event data arrays ported from SelectionDlg.cpp (lines 122-189)
 * Original game: Beijing Fushengji v1.2.2
 *
 * Three types of random events:
 * 1. Commercial Events (18) - Market price changes, free items
 * 2. Health Events (12) - Player health damage
 * 3. Theft Events (7) - Money loss
 */

import type { CommercialEvent, HealthEvent, TheftEvent } from './types';

// ============================================================================
// COMMERCIAL EVENTS (18 total)
// Ported from: Message gameMessages[GAME_MESSAGE_COUNT] in SelectionDlg.cpp
// ============================================================================

export const COMMERCIAL_EVENTS: CommercialEvent[] = [
  // Event 0
  {
    freq: 170,
    msg: '专家预测明年大学生对手机的需求将会激增!',
    drug: 5,
    plus: 2,
    minus: 0,
    add: 0
  },
  // Event 1
  {
    freq: 139,
    msg: '卫生局官员说，今后工商部局将严查假冒伪劣，加紧打假!',
    drug: 3,
    plus: 3,
    minus: 0,
    add: 0
  },
  // Event 2
  {
    freq: 93,
    msg: '市场上出现了一批非常受欢迎的新款手机，并且价格十分便宜!',
    drug: 1,
    plus: 0,
    minus: 3,
    add: 0
  },
  // Event 3
  {
    freq: 99,
    msg: '世界环保组织发表报告，北京工厂对能源的浪费让人触目惊心!',
    drug: 4,
    plus: 5,
    minus: 0,
    add: 0
  },
  // Event 4
  {
    freq: 45,
    msg: '市民连夜排队购买新上市的数码游戏机!',
    drug: 2,
    plus: 4,
    minus: 0,
    add: 0
  },
  // Event 5
  {
    freq: 57,
    msg: '北京网友在网上发表文章，强烈谴责盗版VCD行为!',
    drug: 2,
    plus: 0,
    minus: 5,
    add: 0
  },
  // Event 6
  {
    freq: 17,
    msg: '最新的股市价格指数显示，北京股市一路狂跌，股民损失惨重!',
    drug: 0,
    plus: 0,
    minus: 8,
    add: 0
  },
  // Event 7
  {
    freq: 49,
    msg: '北京市长在会议上承诺要加速燃料汽车的淘汰进程!',
    drug: 4,
    plus: 0,
    minus: 6,
    add: 0
  },
  // Event 8
  {
    freq: 80,
    msg: '欧洲市场传来消息，名贵丝绸在欧洲狂卖，连带效应致使价格飞涨!',
    drug: 5,
    plus: 7,
    minus: 0,
    add: 0
  },
  // Event 9
  {
    freq: 83,
    msg: '欧洲市场传来消息，东方名茶在欧洲狂卖，连带效应致使价格飞涨!',
    drug: 3,
    plus: 7,
    minus: 0,
    add: 0
  },
  // Event 10
  {
    freq: 91,
    msg: '美国商人在亚洲开办了多家大型连锁店，对个人商贩造成威胁!',
    drug: 7,
    plus: 0,
    minus: 7,
    add: 0
  },
  // Event 11
  {
    freq: 160,
    msg: '火车站附近有一批无人认领的古董瓷器，你赶到后也分了一份!',
    drug: 0,
    plus: 0,
    minus: 0,
    add: 2
  },
  // Event 12
  {
    freq: 190,
    msg: '某工厂甩卖抵帐水晶手镯，你赶到后也抢到了一只!',
    drug: 6,
    plus: 0,
    minus: 0,
    add: 1
  },
  // Event 13
  {
    freq: 110,
    msg: '居委会给你送了一部旧手机，你接受了!',
    drug: 1,
    plus: 0,
    minus: 0,
    add: 1
  },
  // Event 14
  {
    freq: 123,
    msg: '你遇到一个陌生人向你推销盗版VCD游戏，价格十分便宜，你买了一些!',
    drug: 2,
    plus: 0,
    minus: 0,
    add: 5
  },
  // Event 15
  {
    freq: 102,
    msg: '一群市民簇拥着你，往你手里塞报纸，你也不好意思拒绝!',
    drug: 7,
    plus: 0,
    minus: 0,
    add: 3
  },
  // Event 16
  {
    freq: 127,
    msg: '工商局官员说，目前市场上有很多古董瓷器都是仿制的假货!',
    drug: 0,
    plus: 0,
    minus: 5,
    add: 0
  },
  // Event 17 (Special: adds debt instead of affecting price)
  {
    freq: 140,
    msg: '一个陌生人给了你一个水晶手镯，并表示感谢你帮他还债!',
    drug: 6,
    plus: 0,
    minus: 0,
    add: 1
    // Note: Original C++ adds 2500 to debt (m_pDlg->MyDebt += 2500)
    // This will be handled specially in EventSystem
  },
];

// ============================================================================
// HEALTH EVENTS (12 total)
// Ported from: BadEvent random_event[BAD_EVENT_NUM] in SelectionDlg.cpp
// ============================================================================

export const HEALTH_EVENTS: HealthEvent[] = [
  // Event 0 - SelectionDlg.cpp line 145
  {
    freq: 117,
    msg: '你在和一个小贩讨价还价时，竟然被他打了一拳!',
    hunt: 3,
    sound: 'kill.wav'
  },
  // Event 1 - SelectionDlg.cpp line 146
  {
    freq: 157,
    msg: '路上遇到两伙黑社会火拼，你被流弹击中!',
    hunt: 20,
    sound: 'death.wav'
  },
  // Event 2 - SelectionDlg.cpp line 147
  {
    freq: 21,
    msg: '警察带着警犬过来检查工作，警犬咬了你一口!',
    hunt: 1,
    sound: 'dog.wav'
  },
  // Event 3 - SelectionDlg.cpp line 148
  {
    freq: 100,
    msg: '正在马路上行走的时候，突然被一辆摩托车撞倒!',
    hunt: 1,
    sound: 'harley.wav'
  },
  // Event 4 - SelectionDlg.cpp line 149 (FIXED)
  {
    freq: 35,
    msg: '被小混混打了一顿!',
    hunt: 1,
    sound: 'hit.wav'
  },
  // Event 5 - SelectionDlg.cpp line 150 (FIXED)
  {
    freq: 313,
    msg: '你被一群暴徒殴打!',
    hunt: 10,
    sound: 'flee.wav'
  },
  // Event 6 - SelectionDlg.cpp line 151 (FIXED)
  {
    freq: 120,
    msg: '路遇抢劫，被人打了一顿!',
    hunt: 5,
    sound: 'death.wav'
  },
  // Event 7 - SelectionDlg.cpp line 152 (FIXED)
  {
    freq: 29,
    msg: '你在楼梯上被一伙歹徒推倒!',
    hunt: 3,
    sound: 'el.wav'
  },
  // Event 8 - SelectionDlg.cpp line 153 (FIXED)
  {
    freq: 43,
    msg: '在路边的小吃摊吃坏了肚子!',
    hunt: 1,
    sound: 'vomit.wav'
  },
  // Event 9 - SelectionDlg.cpp line 154 (FIXED)
  {
    freq: 45,
    msg: '在黑市购买到假货被骗，气得不笑不笑!',
    hunt: 1,
    sound: 'level.wav'
  },
  // Event 10 - SelectionDlg.cpp line 155 (FIXED)
  {
    freq: 48,
    msg: '被小偷偷走了40元!',
    hunt: 1,
    sound: 'lan.wav'
  },
  // Event 11 - SelectionDlg.cpp line 156 (FIXED)
  {
    freq: 33,
    msg: '在大街上被流氓骚扰，吓出了一身冷汗!',
    hunt: 1,
    sound: 'breath.wav'
  },
];

// ============================================================================
// THEFT EVENTS (7 total)
// Ported from: StealEvent random_steal_event[STEAL_EVENT_NUM] in SelectionDlg.cpp
// ============================================================================

export const THEFT_EVENTS: TheftEvent[] = [
  // Event 0 - SelectionDlg.cpp line 183 (FIXED)
  {
    freq: 60,
    msg: '糟糕！在百货大楼遇到扒手，被偷走了10%的现金!',
    ratio: 10
  },
  // Event 1 - SelectionDlg.cpp line 184
  {
    freq: 125,
    msg: '一个小偷在街头盯住了你，抢走了你的钱!',
    ratio: 10
  },
  // Event 2 - SelectionDlg.cpp line 185 (FIXED)
  {
    freq: 100,
    msg: '一个陌生人把你打了一顿，说是认错人了!',
    ratio: 40
  },
  // Event 3 - SelectionDlg.cpp line 186 (FIXED)
  {
    freq: 65,
    msg: '你被流氓婆太太缠住了，不给钱不让走!',
    ratio: 20
  },
  // Event 4 - SelectionDlg.cpp line 187 (FIXED - affects bank)
  {
    freq: 35,
    msg: '接到电信诈骗电话，损失了15%的存款!',
    ratio: 15
    // Note: This affects bank, not cash (EventSystem line 208)
  },
  // Event 5 - SelectionDlg.cpp line 188 (FIXED - affects bank)
  {
    freq: 27,
    msg: '黑车司机说你没带驾照？不拿出钱来就去找警察吧!',
    ratio: 10
    // Note: This affects bank, not cash (EventSystem line 208)
  },
  // Event 6 - SelectionDlg.cpp line 189 (FIXED)
  {
    freq: 40,
    msg: '你在大街上被人讹诈，去医院看病花了一笔钱...',
    ratio: 5
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get total event count for each type
 */
export const EVENT_COUNTS = {
  commercial: COMMERCIAL_EVENTS.length,
  health: HEALTH_EVENTS.length,
  theft: THEFT_EVENTS.length,
} as const;

/**
 * Validate event data integrity (for development/testing)
 */
export function validateEvents(): boolean {
  // Check commercial events
  for (const event of COMMERCIAL_EVENTS) {
    if (event.drug < 0 || event.drug > 7) {
      console.error(`Invalid drug ID in commercial event: ${event.drug}`);
      return false;
    }
  }

  // Check health events
  for (const event of HEALTH_EVENTS) {
    if (event.hunt <= 0 || event.hunt > 30) {
      console.error(`Invalid health damage in health event: ${event.hunt}`);
      return false;
    }
  }

  // Check theft events
  for (const event of THEFT_EVENTS) {
    if (event.ratio <= 0 || event.ratio > 100) {
      console.error(`Invalid theft ratio in theft event: ${event.ratio}`);
      return false;
    }
  }

  return true;
}
