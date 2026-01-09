# 北京浮生记 Web版 (Beijing Fushengji Web)

现代化的北京浮生记 Web 游戏版本，使用 PixiJS v8 构建。

Modern web version of the classic Beijing Fushengji trading game, built with PixiJS v8.

## 简介 (About)

经典贸易模拟游戏。在40天内通过买卖商品、管理健康和财务来获取最高分数。

Classic trading simulation game. Achieve the highest score in 40 days by trading goods, managing health and finances.

## 特性 (Features)

- 100% 忠实原作 - 完整移植原版 C++ 游戏逻辑
- PixiJS 渲染 - GPU 加速流畅体验
- 自动存档 - localStorage 保存进度
- 完整音效 - 原版音效系统
- 现代技术栈 - TypeScript + Vite + PixiJS v8

## 快速开始 (Quick Start)

**要求**: Node.js >= 18, npm >= 9

```bash
# 安装并运行
git clone https://github.com/xrdavies/beijing-fushengji-web.git
cd beijing-fushengji-web
npm install
npm run dev

# 构建
npm run build
npm run preview
```

## 游戏玩法 (Gameplay)

- **交易**: 8种商品低买高卖
- **移动**: 20个地点寻找最优价格（北京10个，上海10个）
- **健康**: 及时就医（¥3,500/点）
- **财务**: 存款获利息(1%/天)，还债避免惩罚（10%/天）
- **事件**: 应对37种随机事件
- **目标**: 40天内最高分

## 技术栈 (Tech)

TypeScript • PixiJS v8 • @pixi/ui • @pixi/sound • Vite

## 许可证 (License)

[GPL-2.0](LICENSE) - 继承自原版游戏

**原作者**: 郭象昊 (2000-2012)
**Web版**: xrdavies (2026-)

## 链接 (Links)

- [问题反馈 Issues](https://github.com/xrdavies/beijing-fushengji-web/issues)
- [原版 C++ 游戏](https://github.com/xrdavies/beijing_fushengji)
