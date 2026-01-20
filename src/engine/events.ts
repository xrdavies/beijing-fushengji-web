/**
 * Event data arrays.
 * Original game: Beijing Fushengji v1.2.2
 *
 * Three types of random events:
 * 1. Commercial Events (18) - Market price changes, free items
 * 2. Health Events (11) - Player health damage
 * 3. Theft Events (8) - Money loss
 */

import type { CommercialEvent, HealthEvent, TheftEvent } from './types';

// ============================================================================
// COMMERCIAL EVENTS (18 total)
// ============================================================================

export const COMMERCIAL_EVENTS: CommercialEvent[] = [
  // Event 0
  {
    freq: 170,
    msg: '专家预测明年大学生对进口玩具的需求将会激增!',
    drug: 5,  // 进口玩具
    plus: 2,
    minus: 0,
    add: 0
  },
  // Event 1
  {
    freq: 139,
    msg: '卫生局官员说，今后将严查假酒，假酒供应量暴跌，市场劣质假酒价格看涨!',
    drug: 3,  // 劣质假酒
    plus: 3,
    minus: 0,
    add: 0
  },
  // Event 2
  {
    freq: 100,
    msg: '医院专家警惕：上海小宝贝很有可能含有壮阳效果!',
    drug: 4,  // 上海小宝贝
    plus: 5,
    minus: 0,
    add: 0
  },
  // Event 3
  {
    freq: 41,
    msg: '网络上盗版VCD热卖，供不应求!',
    drug: 2,  // 盗版VCD
    plus: 4,
    minus: 0,
    add: 0
  },
  // Event 4
  {
    freq: 37,
    msg: '北京市场上走私电器热销，许多人私下进货想趁机赚一笔!',
    drug: 1,  // 走私电器
    plus: 3,
    minus: 0,
    add: 0
  },
  // Event 5
  {
    freq: 23,
    msg: '最新报告表明，多数人都喜欢印度神油，影响到现实中对这种假冒伪劣产品的欢迎!',
    drug: 7,  // 印度神油
    plus: 4,
    minus: 0,
    add: 0
  },
  // Event 6
  {
    freq: 37,
    msg: 'Twitter网站最近发布了很多上海小宝贝的消息，引起了一片哗然!',
    drug: 4,  // 上海小宝贝
    plus: 8,
    minus: 0,
    add: 0
  },
  // Event 7
  {
    freq: 15,
    msg: '谢霆锋最近出席活动说，我一定要使用印度神油! 最终印度神油供不应求!',
    drug: 7,  // 印度神油
    plus: 7,
    minus: 0,
    add: 0
  },
  // Event 8
  {
    freq: 40,
    msg: '地下作坊大量生产劣质假酒，影响到价格!',
    drug: 3,  // 劣质假酒
    plus: 0,
    minus: 6,
    add: 0
  },
  // Event 9
  {
    freq: 29,
    msg: '北京的大学生们开始寻找越南翡翠手镯，很受欢迎!',
    drug: 6,  // 越南翡翠手镯
    plus: 7,
    minus: 0,
    add: 0
  },
  // Event 10
  {
    freq: 35,
    msg: '随着个人风潮的来临，走私电器价格暴涨!',
    drug: 1,  // 走私电器
    plus: 8,
    minus: 0,
    add: 0
  },
  // Event 11
  {
    freq: 17,
    msg: '市场上出现了二手古玩!',
    drug: 0,  // 二手古玩
    plus: 0,
    minus: 8,
    add: 0
  },
  // Event 12
  {
    freq: 24,
    msg: '北京的孩子们忙着学习，没有时间买进口玩具!',
    drug: 5,  // 进口玩具
    plus: 0,
    minus: 5,
    add: 0
  },
  // Event 13
  {
    freq: 18,
    msg: '政府打击十元盗版，很多人都在清仓处理，盗版VCD大甩卖!',
    drug: 2,  // 盗版VCD
    plus: 0,
    minus: 8,
    add: 0
  },
  // Event 14
  {
    freq: 160,
    msg: '你老家的同学送给你几件走私电器，你接受了!',
    drug: 1,  // 走私电器
    plus: 0,
    minus: 0,
    add: 2
  },
  // Event 15
  {
    freq: 45,
    msg: '工商局扫黄后，发现黑暗势力发布的大批失窃的二手古玩!',
    drug: 0,  // 二手古玩
    plus: 0,
    minus: 5,
    add: 6
  },
  // Event 16
  {
    freq: 35,
    msg: '你买年货回家前弄到一批劣质假酒!',
    drug: 3,  // 劣质假酒
    plus: 0,
    minus: 0,
    add: 4
  },
  // Event 17
  // Special event: adds 2500 to debt (handled in EventSystem)
  {
    freq: 140,
    msg: '媒体报道，最近有日本制造的中国仿品被出口! 据说日本制造商被查后，拒绝赔偿损失，还说是消息不实，所以八卦报纸公司送了你一个越南翡翠手镯作为标识硬抵押，还欠你2500元!',
    drug: 6,  // 越南翡翠手镯
    plus: 0,
    minus: 0,
    add: 1
    // Note: Adds 2500 to debt.
    // This will be handled specially in EventSystem
  },
];

// ============================================================================
// HEALTH EVENTS (12 total)
// ============================================================================

export const HEALTH_EVENTS: HealthEvent[] = [
  // Event 0
  {
    freq: 117,
    msg: '你在和一个小贩讨价还价时，竟然被他打了一拳!',
    hunt: 3,
    sound: 'kill.wav'
  },
  // Event 1
  {
    freq: 157,
    msg: '路上遇到两伙黑社会火拼，你被流弹击中!',
    hunt: 20,
    sound: 'death.wav'
  },
  // Event 2
  {
    freq: 21,
    msg: '警察带着警犬过来检查工作，警犬咬了你一口!',
    hunt: 1,
    sound: 'dog.wav'
  },
  // Event 3
  {
    freq: 100,
    msg: '正在马路上行走的时候，突然被一辆摩托车撞倒!',
    hunt: 1,
    sound: 'harley.wav'
  },
  // Event 4
  {
    freq: 35,
    msg: '被小混混打了一顿!',
    hunt: 1,
    sound: 'hit.wav'
  },
  // Event 5
  {
    freq: 313,
    msg: '你被一群暴徒殴打!',
    hunt: 10,
    sound: 'flee.wav'
  },
  // Event 6
  {
    freq: 120,
    msg: '路遇抢劫，被人打了一顿!',
    hunt: 5,
    sound: 'death.wav'
  },
  // Event 7
  {
    freq: 29,
    msg: '你在楼梯上被一伙歹徒推倒!',
    hunt: 3,
    sound: 'el.wav'
  },
  // Event 8
  {
    freq: 43,
    msg: '在路边的小吃摊吃坏了肚子!',
    hunt: 1,
    sound: 'vomit.wav'
  },
  // Event 9
  {
    freq: 45,
    msg: '在黑市购买到假货被骗，气得不笑不笑!',
    hunt: 1,
    sound: 'level.wav'
  },
  // Event 10
  {
    freq: 33,
    msg: '在大街上被流氓骚扰，吓出了一身冷汗!',
    hunt: 1,
    sound: 'breath.wav'
  },
];

// ============================================================================
// THEFT EVENTS (8 total)
// ============================================================================

export const THEFT_EVENTS: TheftEvent[] = [
  // Event 0
  {
    freq: 60,
    msg: '糟糕！在百货大楼遇到扒手，被偷走了10%的现金!',
    ratio: 10
  },
  // Event 1
  {
    freq: 125,
    msg: '一个小偷在街头盯住了你，抢走了你的钱!',
    ratio: 10
  },
  // Event 2
  {
    freq: 100,
    msg: '一个陌生人把你打了一顿，说是认错人了!',
    ratio: 40
  },
  // Event 3
  {
    freq: 65,
    msg: '你被流氓婆太太缠住了，不给钱不让走!',
    ratio: 20
  },
  // Event 4
  {
    freq: 35,
    msg: '接到电信诈骗电话，损失了15%的存款!',
    ratio: 15
    // Note: This affects bank, not cash.
  },
  // Event 5
  {
    freq: 27,
    msg: '黑车司机说你没带驾照？不拿出钱来就去找警察吧!',
    ratio: 10
    // Note: This affects bank, not cash.
  },
  // Event 6
  {
    freq: 40,
    msg: '你在大街上被人讹诈，去医院看病花了一笔钱...',
    ratio: 5
  },
  // Event 7
  {
    freq: 48,
    msg: '被小偷偷走了40元!',
    ratio: 0,
    fixedLoss: 40,
    sound: 'lan.wav'
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
    if (event.fixedLoss && event.fixedLoss > 0) {
      continue;
    }
    if (event.ratio <= 0 || event.ratio > 100) {
      console.error(`Invalid theft ratio in theft event: ${event.ratio}`);
      return false;
    }
  }

  return true;
}
