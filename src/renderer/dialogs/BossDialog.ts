/**
 * BossDialog - Full-screen "Boss is coming!" overlay
 *
 * Features:
 * - Full-screen fake work screen
 * - Close on ESC key or click
 * - Simulates a professional work screen
 */

import { Graphics, Text } from 'pixi.js';
import { BaseDialog } from './BaseDialog';

export class BossDialog extends BaseDialog {
  private instructionText!: Text;

  constructor() {
    // Full screen size
    super(800, 600, 'Microsoft Visual Studio');
    this.createBossDialogUI();
    this.setupKeyboard();
  }

  /**
   * Create boss dialog UI (fake work screen)
   */
  private createBossDialogUI(): void {
    // Override background to be opaque white (work screen)
    this.removeChild(this.background);
    this.background = new Graphics();
    this.background.rect(0, 0, 800, 600);
    this.background.fill(0xffffff);
    this.addChildAt(this.background, 0);

    // Override panel to full screen
    this.removeChild(this.panel);
    this.panel = new Graphics();
    this.panel.rect(0, 0, 800, 600);
    this.panel.fill(0xf0f0f0);
    this.addChildAt(this.panel, 1);

    // Update title bar to look like VS
    this.removeChild(this.titleText);
    this.titleText = new Text({
      text: 'Project - Microsoft Visual Studio',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0x000000,
      }
    });
    this.titleText.x = 10;
    this.titleText.y = 5;
    this.addChild(this.titleText);

    // Fake code editor content
    this.createFakeCodeEditor();

    // Instruction text (subtle)
    this.instructionText = new Text({
      text: '按 ESC 或点击任意位置退出',
      style: {
        fontFamily: 'Arial',
        fontSize: 10,
        fill: 0x888888,
      }
    });
    this.instructionText.x = 320;
    this.instructionText.y = 580;
    this.addChild(this.instructionText);
  }

  /**
   * Create fake code editor content
   */
  private createFakeCodeEditor(): void {
    const contentX = 50;
    const contentY = 100;

    // Fake code text
    const codeLines = [
      'public class Main {',
      '    public static void main(String[] args) {',
      '        System.out.println("Hello World");',
      '        ',
      '        // Initialize database connection',
      '        Connection conn = DriverManager.getConnection(',
      '            "jdbc:mysql://localhost:3306/mydb",',
      '            "username", "password"',
      '        );',
      '        ',
      '        // Execute query',
      '        Statement stmt = conn.createStatement();',
      '        ResultSet rs = stmt.executeQuery(',
      '            "SELECT * FROM users WHERE status = \'active\'"',
      '        );',
      '        ',
      '        while (rs.next()) {',
      '            String name = rs.getString("name");',
      '            System.out.println(name);',
      '        }',
      '        ',
      '        conn.close();',
      '    }',
      '}',
    ];

    let yOffset = contentY;

    for (const line of codeLines) {
      const lineText = new Text({
        text: line,
        style: {
          fontFamily: 'Courier New, monospace',
          fontSize: 14,
          fill: 0x000000,
        }
      });
      lineText.x = contentX;
      lineText.y = yOffset;
      this.addChild(lineText);

      yOffset += 22;
    }

    // Add fake menu bar
    this.createFakeMenuBar();
  }

  /**
   * Create fake menu bar
   */
  private createFakeMenuBar(): void {
    const menuBar = new Graphics();
    menuBar.rect(0, 30, 800, 25);
    menuBar.fill(0xe0e0e0);
    this.addChild(menuBar);

    const menuItems = ['File', 'Edit', 'View', 'Project', 'Build', 'Debug', 'Tools', 'Help'];
    let xOffset = 10;

    for (const item of menuItems) {
      const menuText = new Text({
        text: item,
        style: {
          fontFamily: 'Arial',
          fontSize: 12,
          fill: 0x000000,
        }
      });
      menuText.x = xOffset;
      menuText.y = 35;
      this.addChild(menuText);

      xOffset += 60;
    }
  }

  /**
   * Setup keyboard listener for ESC key
   */
  private setupKeyboard(): void {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && this.visible) {
        this.hide();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    // Store reference for cleanup
    (this as any)._keyHandler = handleKeyPress;
  }

  /**
   * Make entire dialog clickable to close
   */
  private makeClickableToClose(): void {
    this.background.eventMode = 'static';
    this.background.cursor = 'pointer';
    this.background.on('pointerdown', () => this.hide());
  }

  /**
   * Open boss dialog
   */
  open(): void {
    this.makeClickableToClose();
    this.show();
  }

  protected onOpen(): void {
    console.log('Boss screen activated!');
  }

  protected onClose(): void {
    console.log('Boss screen deactivated');
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if ((this as any)._keyHandler) {
      window.removeEventListener('keydown', (this as any)._keyHandler);
    }
    super.destroy();
  }
}
