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

import { Container, Graphics, Text, Application } from 'pixi.js';
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

export class MainGameScene extends Container {
  private app: Application;
  private statsPanel!: StatsPanel;
  private marketList!: MarketList;
  private inventoryList!: InventoryList;
  private newsTicker!: NewsTicker;
  private actionButtons: Map<string, Container> = new Map();

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
    background.rect(0, 0, 800, 600);
    background.fill(0x0a0a0a);
    this.addChild(background);

    // Title
    const title = new Text({
      text: '北京浮生记',
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 24,
        fill: 0xffffff,
        fontWeight: 'bold',
      }
    });
    title.x = 20;
    title.y = 10;
    this.addChild(title);

    // Settings button (gear icon - using text for now)
    const settingsButton = new Button(
      new Graphics()
        .roundRect(0, 0, 40, 40, 5)
        .fill(0x3a7bc8)
    );

    const settingsText = new Text({
      text: '⚙',
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xffffff,
      }
    });
    settingsText.anchor.set(0.5);
    settingsText.x = 20;
    settingsText.y = 20;

    if (settingsButton.view) {
      settingsButton.view.addChild(settingsText);
      settingsButton.view.x = 740;
      settingsButton.view.y = 10;
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
    const buttonWidth = 80;
    const buttonHeight = 35;
    const startX = 20;
    const startY = 470;
    const spacing = 10;

    for (let i = 0; i < buttonNames.length; i++) {
      const buttonContainer = new Container();

      const button = new Button(
        new Graphics()
          .roundRect(0, 0, buttonWidth, buttonHeight, 5)
          .fill(0x3a7bc8)
      );

      const buttonText = new Text({
        text: buttonNames[i],
        style: {
          fontFamily: 'Microsoft YaHei, Arial',
          fontSize: 14,
          fill: 0xffffff,
        }
      });
      buttonText.anchor.set(0.5);
      buttonText.x = buttonWidth / 2;
      buttonText.y = buttonHeight / 2;
      if (button.view) {
        button.view.addChild(buttonText);
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
  }

  /**
   * Update UI with current game state
   */
  private updateUI(state: GameState): void {
    this.statsPanel.update(state);
    this.marketList.update(state);
    this.inventoryList.update(state);
  }
}
