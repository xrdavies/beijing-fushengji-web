/**
 * Main Game Scene - The primary game interface
 *
 * Layout (800x600):
 * - Background
 * - StatsPanel (top right)
 * - MarketList (left)
 * - InventoryList (right)
 * - Action buttons (bottom)
 * - News ticker (bottom)
 * - Location menu (center)
 */

import { Container, Graphics, Text, Application, FillGradient } from 'pixi.js';
import { Button } from '@pixi/ui';
import { StatsPanel } from '../ui/StatsPanel';
import { MarketList } from '../ui/MarketList';
import { InventoryList } from '../ui/InventoryList';
import { NewsTicker } from '../ui/NewsTicker';
import type { GameState } from '@engine/types';
import { gameStateManager } from '@state/GameStateManager';
import { assetLoader } from '@assets/AssetLoader';

// Import all dialogs
import { BuyDialog } from '../dialogs/BuyDialog';
import { SellDialog } from '../dialogs/SellDialog';
import { BankDialog } from '../dialogs/BankDialog';
import { HospitalDialog } from '../dialogs/HospitalDialog';
import { HouseDialog } from '../dialogs/HouseDialog';
import { WangbaDialog } from '../dialogs/WangbaDialog';
import { NewsDialog } from '../dialogs/NewsDialog';
import { TopPlayersDialog } from '../dialogs/TopPlayersDialog';
import { SettingsDialog } from '../dialogs/SettingsDialog';
import { BossDialog } from '../dialogs/BossDialog';
import { GameOverDialog } from '../dialogs/GameOverDialog';
import { TravelDialog } from '../dialogs/TravelDialog';
import { ConfirmDialog } from '../dialogs/ConfirmDialog';

export class MainGameScene extends Container {
  private app: Application;
  private statsPanel!: StatsPanel;
  private marketList!: MarketList;
  private inventoryList!: InventoryList;
  private newsTicker!: NewsTicker;
  private actionButtons: Map<string, Container> = new Map();
  private gameOverShown: boolean = false; // Track if game over dialog has been shown

  // Dialogs
  private buyDialog!: BuyDialog;
  private sellDialog!: SellDialog;
  private bankDialog!: BankDialog;
  private hospitalDialog!: HospitalDialog;
  private houseDialog!: HouseDialog;
  private wangbaDialog!: WangbaDialog;
  private newsDialog!: NewsDialog;
  private topPlayersDialog!: TopPlayersDialog;
  private settingsDialog!: SettingsDialog;
  private bossDialog!: BossDialog;
  private gameOverDialog!: GameOverDialog;
  private travelDialog!: TravelDialog;
  private confirmDialog!: ConfirmDialog;

  constructor(app: Application) {
    super();
    this.app = app;

    // Create background
    this.createBackground();

    // Create UI components
    this.createStatsPanel();
    this.createMarketList();
    this.createInventoryList();
    this.createNewsTicker();
    this.createActionButtons();

    // Create dialogs
    this.createDialogs();

    // Subscribe to state changes
    gameStateManager.subscribe((state) => {
      this.updateUI(state);
    });

    // Start ticker animation
    this.app.ticker.add((delta) => {
      this.newsTicker.update(delta.deltaTime);
    });
  }

  /**
   * Create background
   */
  private createBackground(): void {
    const background = new Graphics();
    const bgGradient = new FillGradient({
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: 0x0f141a },
        { offset: 1, color: 0x0a0d12 },
      ],
      textureSpace: 'local',
    });
    background.rect(0, 0, 800, 600);
    background.fill(bgGradient);
    this.addChild(background);

    const headerGlow = new Graphics();
    headerGlow.rect(0, 0, 800, 70);
    headerGlow.fill({ color: 0x142033, alpha: 0.35 });
    this.addChild(headerGlow);

    const topRule = new Graphics();
    topRule.moveTo(20, 50);
    topRule.lineTo(780, 50);
    topRule.stroke({ color: 0x1f2a3a, width: 1 });
    this.addChild(topRule);

    // Title
    const title = new Text({
      text: '北京浮生记',
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 26,
        fill: 0xf8fafc,
        fontWeight: 'bold',
        letterSpacing: 1,
      }
    });
    title.x = 24;
    title.y = 12;
    this.addChild(title);

    const titleAccent = new Graphics();
    titleAccent.roundRect(title.x, title.y + 32, 60, 3, 2);
    titleAccent.fill(0x3a7bc8);
    this.addChild(titleAccent);

    // Settings button (gear icon - using text for now)
    const settingsButtonContainer = new Container();

    const settingsButtonBg = new Graphics();
    settingsButtonBg.roundRect(0, 0, 44, 44, 10);
    settingsButtonBg.fill(0x2f6fce);
    settingsButtonBg.stroke({ width: 1, color: 0x1e3355 });

    const settingsShine = new Graphics();
    settingsShine.roundRect(2, 2, 40, 20, 8);
    settingsShine.fill({ color: 0xffffff, alpha: 0.08 });

    const settingsText = new Text({
      text: '⚙',
      style: {
        fontFamily: 'Arial',
        fontSize: 26,
        fill: 0xffffff,
      }
    });
    settingsText.anchor.set(0.5);
    settingsText.x = 22; // Adjusted from 20 to center in 44px button
    settingsText.y = 22; // Adjusted from 20 to center in 44px button

    settingsButtonContainer.addChild(settingsButtonBg);
    settingsButtonContainer.addChild(settingsShine);
    settingsButtonContainer.addChild(settingsText);
    settingsButtonContainer.x = 736; // Adjusted from 740 to keep aligned
    settingsButtonContainer.y = 10;

    const settingsButton = new Button(settingsButtonContainer);

    if (settingsButton.view) {
      this.addChild(settingsButton.view);
    }

    settingsButton.onPress.connect(() => {
      this.settingsDialog.open();
    });
  }

  /**
   * Create stats panel (top right)
   */
  private createStatsPanel(): void {
    this.statsPanel = new StatsPanel(200, 300);
    this.statsPanel.x = 580;
    this.statsPanel.y = 50;
    this.addChild(this.statsPanel);
  }

  /**
   * Create market list (left side)
   */
  private createMarketList(): void {
    this.marketList = new MarketList(270, 400);
    this.marketList.x = 20;
    this.marketList.y = 50;
    this.addChild(this.marketList);

    // Set click handler - Open BuyDialog
    this.marketList.setOnItemClick((drugId) => {
      this.buyDialog.openForDrug(drugId);
    });
  }

  /**
   * Create inventory list (center)
   */
  private createInventoryList(): void {
    this.inventoryList = new InventoryList(270, 400);
    this.inventoryList.x = 300;
    this.inventoryList.y = 50;
    this.addChild(this.inventoryList);

    // Set click handler - Open SellDialog
    this.inventoryList.setOnItemClick((drugId) => {
      this.sellDialog.openForDrug(drugId);
    });
  }

  /**
   * Create news ticker (bottom)
   */
  private createNewsTicker(): void {
    this.newsTicker = new NewsTicker(760, 30);
    this.newsTicker.x = 20;
    this.newsTicker.y = 560;
    this.addChild(this.newsTicker);

    // Load news from asset loader
    const newsItems = assetLoader.getNewsItems();
    this.newsTicker.setNewsItems(newsItems);
  }

  /**
   * Create action buttons (bottom center)
   */
  private createActionButtons(): void {
    const buttonNames = ['银行', '医院', '租房', '网吧', '旅行'];
    const buttonWidth = 86;
    const buttonHeight = 44; // Increased from 35 to 44 for better mobile touch
    const spacing = 12;
    const totalWidth = buttonNames.length * buttonWidth + (buttonNames.length - 1) * spacing;
    const startX = Math.round((800 - totalWidth) / 2);
    const startY = 468; // Balanced spacing above the ticker

    for (let i = 0; i < buttonNames.length; i++) {
      const buttonContainer = new Container();

      const buttonBg = new Graphics();
      buttonBg.roundRect(0, 0, buttonWidth, buttonHeight, 10);
      buttonBg.fill(0x2f6fce);
      buttonBg.stroke({ width: 1, color: 0x1e3355, alpha: 0.9 });

      const buttonHighlight = new Graphics();
      buttonHighlight.roundRect(1, 1, buttonWidth - 2, Math.round(buttonHeight * 0.45), 9);
      buttonHighlight.fill({ color: 0xffffff, alpha: 0.08 });

      const buttonText = new Text({
        text: buttonNames[i],
        style: {
          fontFamily: 'Microsoft YaHei, Arial',
          fontSize: 15,
          fill: 0xffffff,
          fontWeight: 'bold',
        }
      });
      buttonText.anchor.set(0.5);
      buttonText.x = buttonWidth / 2;
      buttonText.y = buttonHeight / 2;

      const buttonView = new Container();
      buttonView.addChild(buttonBg);
      buttonView.addChild(buttonHighlight);
      buttonView.addChild(buttonText);

      const button = new Button(buttonView);

      if (button.view) {
        buttonContainer.addChild(button.view);
      }
      buttonContainer.x = startX + i * (buttonWidth + spacing);
      buttonContainer.y = startY;

      // Wire button to corresponding dialog
      button.onPress.connect(() => {
        this.handleActionButton(buttonNames[i]);
      });

      this.addChild(buttonContainer);
      this.actionButtons.set(buttonNames[i], buttonContainer);
    }
  }

  /**
   * Handle action button clicks
   */
  private handleActionButton(buttonName: string): void {
    switch (buttonName) {
      case '银行':
        this.bankDialog.open();
        break;
      case '医院':
        this.hospitalDialog.open();
        break;
      case '租房':
        this.houseDialog.open();
        break;
      case '网吧':
        this.wangbaDialog.open();
        break;
      case '旅行':
        this.travelDialog.open();
        break;
    }
  }

  /**
   * Create all dialogs
   */
  private createDialogs(): void {
    // Trading dialogs
    this.buyDialog = new BuyDialog();
    this.addChild(this.buyDialog);

    this.sellDialog = new SellDialog();
    this.addChild(this.sellDialog);

    // Service dialogs
    this.bankDialog = new BankDialog();
    this.addChild(this.bankDialog);

    this.hospitalDialog = new HospitalDialog();
    this.addChild(this.hospitalDialog);

    this.houseDialog = new HouseDialog();
    this.addChild(this.houseDialog);

    this.wangbaDialog = new WangbaDialog();
    this.addChild(this.wangbaDialog);

    // Info dialogs
    this.newsDialog = new NewsDialog();
    this.addChild(this.newsDialog);

    this.topPlayersDialog = new TopPlayersDialog();
    this.addChild(this.topPlayersDialog);

    this.settingsDialog = new SettingsDialog();
    this.addChild(this.settingsDialog);

    // Special dialogs
    this.bossDialog = new BossDialog();
    this.addChild(this.bossDialog);

    this.gameOverDialog = new GameOverDialog();
    this.addChild(this.gameOverDialog);

    this.travelDialog = new TravelDialog();
    this.addChild(this.travelDialog);

    // Utility dialogs
    this.confirmDialog = new ConfirmDialog();
    this.addChild(this.confirmDialog);
  }

  /**
   * Update UI with current game state
   */
  private updateUI(state: GameState): void {
    this.statsPanel.update(state);
    this.marketList.update(state);
    this.inventoryList.update(state);

    // Reset game over flag when new game starts (day resets to 40 and health to 100)
    if (state.timeLeft === 40 && state.health === 100 && this.gameOverShown) {
      this.gameOverShown = false;
    }

    // CRITICAL: Auto-trigger game over dialog when game ends
    // This is a safety net that catches both conditions:
    // 1. Time ran out (timeLeft <= 0)
    // 2. Player died (health <= 0)
    if (gameStateManager.isGameOver() && !this.gameOverShown && !this.gameOverDialog.visible) {
      this.gameOverShown = true;

      // Delay to allow primary handlers (TravelDialog) to run first
      // and to ensure all state updates are complete
      setTimeout(() => {
        if (!this.gameOverDialog.visible) {
          this.gameOverDialog.open();
        }
      }, 1000);
    }
  }
}
