/**
 * StockDialog - Dialog for buying and selling stocks
 *
 * Features:
 * - Stock list with current prices and holdings
 * - Buy/Sell sliders with separate actions
 * - Fee display for each trade
 */

import { Container, Graphics, Text } from 'pixi.js';
import { BaseDialog } from './BaseDialog';
import { STOCKS, GAME_CONSTANTS, type StockCandle } from '@engine/types';
import { gameStateManager } from '@state/GameStateManager';
import { createButton, SimpleSlider } from '../ui/SimpleUIHelpers';
import { audioManager } from '@audio/AudioManager';

export class StockDialog extends BaseDialog {
  private stockId: number = 0;

  private stockItems: Container[] = [];
  private stockItemUpdateFns: Map<number, (hovered?: boolean) => void> = new Map();

  private listWidth = 240;
  private chartWidth = 400;
  private chartHeight = 180;
  private klineFrame!: Graphics;
  private klineChart!: Graphics;
  private klineTitleText!: Text;

  private nameText!: Text;
  private summaryPriceText!: Text;
  private summaryAvgText!: Text;
  private summaryHoldText!: Text;
  private summaryValueText!: Text;
  private buyMaxText!: Text;
  private sellMaxText!: Text;
  private buySharesText!: Text;
  private sellSharesText!: Text;
  private buyTotalText!: Text;
  private sellTotalText!: Text;
  private buyFeeText!: Text;
  private sellFeeText!: Text;
  private buySlider!: SimpleSlider;
  private sellSlider!: SimpleSlider;
  private buyButton!: Container;
  private sellButton!: Container;

  private currentPrice = 0;
  private buyShares = 0;
  private sellShares = 0;
  private buyMaxShares = 0;
  private sellMaxShares = 0;
  private summaryStartX = 0;
  private summaryGap = 14;

  constructor() {
    super(720, 580, '股市');
    this.createStockDialogUI();
  }

  private createStockDialogUI(): void {
    const panelX = (800 - this.dialogWidth) / 2;
    const panelY = (600 - this.dialogHeight) / 2;
    const contentX = panelX + 24;
    const currentY = panelY + 60;
    const listX = contentX;
    const listY = currentY;
    const rightX = contentX + this.listWidth + 20;

    this.createStockList(listX, listY, this.listWidth);
    this.createKLinePanel(rightX, listY);

    const detailsY = listY + this.chartHeight + 28;
    this.createDetails(rightX, detailsY);
  }

  private createStockList(contentX: number, contentY: number, itemWidth: number): void {
    const title = new Text({
      text: '股票列表:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa },
    });
    title.x = contentX;
    title.y = contentY;
    this.addChild(title);

    const listStartY = contentY + 28;
    const itemHeight = 36;
    const rowGap = 10;

    for (let i = 0; i < STOCKS.length; i++) {
      const row = i;
      const itemX = contentX;
      const itemY = listStartY + row * (itemHeight + rowGap);

      const container = new Container();
      container.x = itemX;
      container.y = itemY;
      container.eventMode = 'static';
      container.cursor = 'pointer';

      const background = new Graphics();
      const renderBackground = (color: number) => {
        background.clear();
        background.roundRect(0, 0, itemWidth, itemHeight, 6);
        background.fill(color);
      };
      renderBackground(0x252c35);
      container.addChild(background);

      const nameText = new Text({
        text: STOCKS[i].name,
        style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xffffff },
      });
      nameText.x = 10;
      nameText.y = 3;
      container.addChild(nameText);

      const holdingText = new Text({
        text: '持有: 0',
        style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 11, fill: 0x9aa4b2 },
      });
      holdingText.x = 10;
      holdingText.y = 22;
      container.addChild(holdingText);
      (container as any).holdingText = holdingText;

      const changeText = new Text({
        text: '— 0.0%',
        style: { fontFamily: 'Consolas, Arial', fontSize: 12, fill: 0x9aa4b2 },
      });
      changeText.x = itemWidth - 10;
      changeText.y = 4;
      changeText.anchor.set(1, 0);
      container.addChild(changeText);
      (container as any).changeText = changeText;

      const priceText = new Text({
        text: '¥0',
        style: { fontFamily: 'Consolas, Arial', fontSize: 12, fill: 0x9aa4b2 },
      });
      priceText.x = itemWidth - 10;
      priceText.y = 18;
      priceText.anchor.set(1, 0);
      container.addChild(priceText);
      (container as any).priceText = priceText;

      const updateItemState = (hovered: boolean = false) => {
        if (hovered) {
          renderBackground(0x334155);
          return;
        }
        renderBackground(this.stockId === i ? 0x1f4d7a : 0x252c35);
      };

      this.stockItemUpdateFns.set(i, updateItemState);
      updateItemState();

      container.on('pointerover', () => updateItemState(true));
      container.on('pointerout', () => updateItemState(false));
      container.on('pointertap', () => {
        audioManager.play('click');
        this.selectStock(i);
      });

      this.addChild(container);
      this.stockItems.push(container);
    }
  }

  private createKLinePanel(contentX: number, contentY: number): void {
    this.klineTitleText = new Text({
      text: 'K线走势:',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa },
    });
    this.klineTitleText.x = contentX;
    this.klineTitleText.y = contentY;
    this.addChild(this.klineTitleText);

    this.nameText = new Text({
      text: '',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xffffff, fontWeight: 'bold' },
    });
    this.nameText.x = contentX + 88;
    this.nameText.y = contentY;
    this.addChild(this.nameText);

    const frameY = contentY + 26;
    this.klineFrame = new Graphics();
    this.klineFrame.roundRect(0, 0, this.chartWidth, this.chartHeight, 8);
    this.klineFrame.fill(0x1d232a);
    this.klineFrame.stroke({ color: 0x2f6fce, width: 1, alpha: 0.6 });
    this.klineFrame.x = contentX;
    this.klineFrame.y = frameY;
    this.addChild(this.klineFrame);

    this.klineChart = new Graphics();
    this.klineChart.x = contentX + 8;
    this.klineChart.y = frameY + 6;
    this.addChild(this.klineChart);
  }

  private createDetails(contentX: number, contentY: number): void {
    const labelStyle = { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xaaaaaa };
    const valueStyle = { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xffffff };
    const sectionWidth = this.chartWidth;
    const sectionHeight = 116;
    const sectionGap = 14;
    const sliderWidth = 210;
    const buttonWidth = 110;
    const buttonGap = 22;

    this.summaryStartX = contentX;
    this.summaryPriceText = new Text({
      text: '现价 ¥0',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0x22c55e, fontWeight: 'bold' },
    });
    this.summaryPriceText.y = contentY;
    this.addChild(this.summaryPriceText);

    this.summaryAvgText = new Text({
      text: '均价 ¥0',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xffaa00, fontWeight: 'bold' },
    });
    this.summaryAvgText.y = contentY;
    this.addChild(this.summaryAvgText);

    this.summaryHoldText = new Text({
      text: '持有 0股',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0x60a5fa, fontWeight: 'bold' },
    });
    this.summaryHoldText.y = contentY;
    this.addChild(this.summaryHoldText);

    this.summaryValueText = new Text({
      text: '市值 ¥0',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 16, fill: 0xf97316, fontWeight: 'bold' },
    });
    this.summaryValueText.y = contentY;
    this.addChild(this.summaryValueText);

    this.layoutSummaryLine();

    contentY += 30;

    const buySectionY = contentY;
    const buyBg = new Graphics();
    buyBg.roundRect(0, 0, sectionWidth, sectionHeight, 8);
    buyBg.fill(0x1f2937);
    buyBg.x = contentX;
    buyBg.y = buySectionY;
    this.addChild(buyBg);

    const buyLabel = new Text({ text: '买入股数:', style: labelStyle });
    buyLabel.x = contentX + 10;
    buyLabel.y = buySectionY + 8;
    this.addChild(buyLabel);

    this.buySharesText = new Text({ text: '0股', style: valueStyle });
    this.buySharesText.x = contentX + 90;
    this.buySharesText.y = buySectionY + 8;
    this.addChild(this.buySharesText);

    this.buyMaxText = new Text({ text: '最大: 0', style: { ...valueStyle, fill: 0xffaa00 } });
    this.buyMaxText.x = contentX + sectionWidth - 10;
    this.buyMaxText.y = buySectionY + 8;
    this.buyMaxText.anchor.set(1, 0);
    this.addChild(this.buyMaxText);

    const buySliderY = buySectionY + 40;
    this.buySlider = new SimpleSlider(sliderWidth, 0, 100, 0);
    this.buySlider.x = contentX + 10;
    this.buySlider.y = buySliderY;
    this.addChild(this.buySlider);
    this.buySlider.onValueChange((value) => {
      this.buyShares = Math.floor(value);
      this.updateBuyDisplay();
    });

    this.buyButton = createButton('买入', buttonWidth, 40, 0x00aa00, () => this.handleBuy());
    this.buyButton.x = contentX + 10 + sliderWidth + buttonGap;
    this.buyButton.y = buySliderY - 6;
    this.addChild(this.buyButton);

    this.buyTotalText = new Text({
      text: '总花费: ¥0',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0xffaa00 },
    });
    this.buyTotalText.x = contentX + 10;
    this.buyTotalText.y = buySectionY + 82;
    this.addChild(this.buyTotalText);

    this.buyFeeText = new Text({
      text: '手续费: ¥0',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 13, fill: 0x9aa4b2 },
    });
    this.buyFeeText.x = contentX + sectionWidth - 10;
    this.buyFeeText.y = buySectionY + 82;
    this.buyFeeText.anchor.set(1, 0);
    this.addChild(this.buyFeeText);

    const sellSectionY = buySectionY + sectionHeight + sectionGap;
    const sellBg = new Graphics();
    sellBg.roundRect(0, 0, sectionWidth, sectionHeight, 8);
    sellBg.fill(0x2a1f1f);
    sellBg.x = contentX;
    sellBg.y = sellSectionY;
    this.addChild(sellBg);

    const sellLabel = new Text({ text: '卖出股数:', style: labelStyle });
    sellLabel.x = contentX + 10;
    sellLabel.y = sellSectionY + 8;
    this.addChild(sellLabel);

    this.sellSharesText = new Text({ text: '0股', style: valueStyle });
    this.sellSharesText.x = contentX + 90;
    this.sellSharesText.y = sellSectionY + 8;
    this.addChild(this.sellSharesText);

    this.sellMaxText = new Text({ text: '最大: 0', style: { ...valueStyle, fill: 0xffaa00 } });
    this.sellMaxText.x = contentX + sectionWidth - 10;
    this.sellMaxText.y = sellSectionY + 8;
    this.sellMaxText.anchor.set(1, 0);
    this.addChild(this.sellMaxText);

    const sellSliderY = sellSectionY + 40;
    this.sellSlider = new SimpleSlider(sliderWidth, 0, 100, 0);
    this.sellSlider.x = contentX + 10;
    this.sellSlider.y = sellSliderY;
    this.addChild(this.sellSlider);
    this.sellSlider.onValueChange((value) => {
      this.sellShares = Math.floor(value);
      this.updateSellDisplay();
    });

    this.sellButton = createButton('卖出', buttonWidth, 40, 0x3a7bc8, () => this.handleSell());
    this.sellButton.x = contentX + 10 + sliderWidth + buttonGap;
    this.sellButton.y = sellSliderY - 6;
    this.addChild(this.sellButton);

    this.sellTotalText = new Text({
      text: '到账金额: ¥0',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 14, fill: 0x22c55e },
    });
    this.sellTotalText.x = contentX + 10;
    this.sellTotalText.y = sellSectionY + 82;
    this.addChild(this.sellTotalText);

    this.sellFeeText = new Text({
      text: '手续费: ¥0',
      style: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 13, fill: 0x9aa4b2 },
    });
    this.sellFeeText.x = contentX + sectionWidth - 10;
    this.sellFeeText.y = sellSectionY + 82;
    this.sellFeeText.anchor.set(1, 0);
    this.addChild(this.sellFeeText);
  }

  private selectStock(stockId: number): void {
    if (stockId === this.stockId) {
      return;
    }
    this.stockId = stockId;
    for (const update of this.stockItemUpdateFns.values()) {
      update();
    }
    this.updateStockDetails();
  }

  private updateStockDetails(): void {
    const state = gameStateManager.getState();
    const price = state.stockPrices[this.stockId] ?? 0;
    const holding = state.stockHoldings[this.stockId];

    this.nameText.text = STOCKS[this.stockId]?.name ?? '未知';
    const holdingShares = holding?.shares ?? 0;
    const avgPrice = holding?.avgPrice ?? 0;
    const totalValue = holdingShares * price;
    this.summaryPriceText.text = `现价 ¥${price.toLocaleString('zh-CN')}`;
    this.summaryAvgText.text = `均价 ¥${avgPrice.toLocaleString('zh-CN')}`;
    this.summaryHoldText.text = `持有 ${holdingShares}股`;
    this.summaryValueText.text = `市值 ¥${totalValue.toLocaleString('zh-CN')}`;
    this.layoutSummaryLine();

    const history = state.stockHistory?.[this.stockId] ?? [];
    this.updateKLine(history);

    this.currentPrice = price;
    this.updateTradeLimits();
    this.buySlider.setValue(0);
    this.sellSlider.setValue(0);
    this.buyShares = 0;
    this.sellShares = 0;
    this.updateBuyDisplay();
    this.updateSellDisplay();
  }

  private updateKLine(history: StockCandle[]): void {
    this.klineChart.clear();

    if (!history || history.length === 0) {
      return;
    }

    const chartWidth = this.chartWidth - 16;
    const chartHeight = this.chartHeight - 12;

    const highs = history.map((candle) => candle.high);
    const lows = history.map((candle) => candle.low);
    const max = Math.max(...highs);
    const min = Math.min(...lows);
    const range = max - min || 1;

    const count = history.length;
    const step = chartWidth / count;
    const bodyWidth = Math.max(4, Math.min(10, step * 0.6));
    const wickColor = 0x94a3b8;

    for (let i = 0; i < count; i++) {
      const candle = history[i];
      const centerX = i * step + step / 2;

      const yHigh = ((max - candle.high) / range) * chartHeight;
      const yLow = ((max - candle.low) / range) * chartHeight;
      const yOpen = ((max - candle.open) / range) * chartHeight;
      const yClose = ((max - candle.close) / range) * chartHeight;

      this.klineChart.moveTo(centerX, yHigh);
      this.klineChart.lineTo(centerX, yLow);
      this.klineChart.stroke({ color: wickColor, width: 1 });

      const up = candle.close >= candle.open;
      const bodyColor = up ? 0x22c55e : 0xef4444;
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
      this.klineChart.rect(
        centerX - bodyWidth / 2,
        bodyTop,
        bodyWidth,
        bodyHeight
      );
      this.klineChart.fill(bodyColor);
    }
  }

  private updateTradeLimits(): void {
    const state = gameStateManager.getState();
    const price = this.currentPrice;
    const costPerShare = price * (1 + GAME_CONSTANTS.STOCK_TRADE_FEE_RATE);

    this.buyMaxShares = price > 0 ? Math.floor(state.cash / costPerShare) : 0;
    this.sellMaxShares = state.stockHoldings[this.stockId]?.shares ?? 0;

    this.buyMaxText.text = `最大: ${this.buyMaxShares}`;
    this.sellMaxText.text = `最大: ${this.sellMaxShares}`;
    this.buySlider.setMax(this.buyMaxShares);
    this.sellSlider.setMax(this.sellMaxShares);

    this.updateTradeButtons();
  }

  private layoutSummaryLine(): void {
    let cursor = this.summaryStartX;
    this.summaryPriceText.x = cursor;
    cursor += this.summaryPriceText.width + this.summaryGap;
    this.summaryAvgText.x = cursor;
    cursor += this.summaryAvgText.width + this.summaryGap;
    this.summaryHoldText.x = cursor;
    cursor += this.summaryHoldText.width + this.summaryGap;
    this.summaryValueText.x = cursor;
  }

  private updateBuyDisplay(): void {
    this.buySharesText.text = `${this.buyShares}股`;
    const raw = this.currentPrice * this.buyShares;
    const fee = Math.ceil(raw * GAME_CONSTANTS.STOCK_TRADE_FEE_RATE);
    this.buyTotalText.text = `总花费: ¥${(raw + fee).toLocaleString('zh-CN')}`;
    this.buyFeeText.text = `手续费: ¥${fee.toLocaleString('zh-CN')}`;
    this.updateTradeButtons();
  }

  private updateSellDisplay(): void {
    this.sellSharesText.text = `${this.sellShares}股`;
    const raw = this.currentPrice * this.sellShares;
    const fee = Math.ceil(raw * GAME_CONSTANTS.STOCK_TRADE_FEE_RATE);
    this.sellTotalText.text = `到账金额: ¥${Math.max(0, raw - fee).toLocaleString('zh-CN')}`;
    this.sellFeeText.text = `手续费: ¥${fee.toLocaleString('zh-CN')}`;
    this.updateTradeButtons();
  }

  private updateTradeButtons(): void {
    const canBuy = this.buyMaxShares > 0 && this.buyShares > 0;
    const canSell = this.sellMaxShares > 0 && this.sellShares > 0;

    this.buyButton.eventMode = canBuy ? 'static' : 'none';
    this.buyButton.cursor = canBuy ? 'pointer' : 'default';
    this.buyButton.alpha = canBuy ? 1 : 0.55;

    this.sellButton.eventMode = canSell ? 'static' : 'none';
    this.sellButton.cursor = canSell ? 'pointer' : 'default';
    this.sellButton.alpha = canSell ? 1 : 0.55;
  }

  private handleBuy(): void {
    if (this.buyShares === 0) {
      return;
    }

    const result = gameStateManager.buyStock(this.stockId, this.buyShares);
    if (result && result.success) {
      audioManager.play('buy');
      this.refreshAfterTrade();
    } else if (result) {
      console.error(`Stock buy failed: ${result.error}`);
    }
  }

  private handleSell(): void {
    if (this.sellShares === 0) {
      return;
    }

    const result = gameStateManager.sellStock(this.stockId, this.sellShares);
    if (result && result.success) {
      audioManager.play('sell');
      this.refreshAfterTrade();
    } else if (result) {
      console.error(`Stock sell failed: ${result.error}`);
    }
  }

  private refreshAfterTrade(): void {
    const state = gameStateManager.getState();
    for (let i = 0; i < this.stockItems.length; i++) {
      const container = this.stockItems[i];
      const priceText = (container as any).priceText as Text;
      const holdingText = (container as any).holdingText as Text;
      const price = state.stockPrices[i] ?? 0;
      const holding = state.stockHoldings[i]?.shares ?? 0;
      priceText.text = `¥${price.toLocaleString('zh-CN')}`;
      priceText.style.fill = 0x22c55e;
      if (holdingText) {
        holdingText.text = `持有: ${holding}`;
      }
    }

    this.updateStockDetails();
  }

  open(): void {
    if (gameStateManager.isGameOver()) {
      console.log('Game is over, cannot open stock dialog');
      const gameOverDialog = this.parent?.children.find(
        (child) => child.constructor.name === 'GameOverDialog'
      ) as any;
      if (gameOverDialog && gameOverDialog.open) {
        gameOverDialog.open();
      }
      return;
    }

    const state = gameStateManager.getState();
    this.stockId = 0;
    for (const update of this.stockItemUpdateFns.values()) {
      update();
    }

    for (let i = 0; i < this.stockItems.length; i++) {
      const container = this.stockItems[i];
      const priceText = (container as any).priceText as Text;
      const holdingText = (container as any).holdingText as Text;
      const changeText = (container as any).changeText as Text;
      const price = state.stockPrices[i] ?? 0;
      const holding = state.stockHoldings[i]?.shares ?? 0;
      const history = state.stockHistory?.[i] ?? [];
      const prevClose =
        history.length >= 2 ? history[history.length - 2].close : history[history.length - 1]?.close;
      const lastClose = history.length >= 1 ? history[history.length - 1].close : price;
      const changeRatio = prevClose && prevClose > 0 ? (lastClose - prevClose) / prevClose : 0;
      const changePercent = Math.abs(changeRatio * 100);
      priceText.text = `¥${price.toLocaleString('zh-CN')}`;
      priceText.style.fill = 0x22c55e;
      if (holdingText) {
        holdingText.text = `持有: ${holding}`;
      }
      if (changeText) {
        if (changeRatio > 0.0001) {
          changeText.text = `↑ ${changePercent.toFixed(1)}%`;
          changeText.style.fill = 0x22c55e;
        } else if (changeRatio < -0.0001) {
          changeText.text = `↓ ${changePercent.toFixed(1)}%`;
          changeText.style.fill = 0xef4444;
        } else {
          changeText.text = '— 0.0%';
          changeText.style.fill = 0x9aa4b2;
        }
      }
    }

    this.updateStockDetails();

    this.show();
  }

  protected onOpen(): void {}

  protected onClose(): void {}
}
