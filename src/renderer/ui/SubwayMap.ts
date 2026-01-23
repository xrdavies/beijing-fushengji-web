/**
 * SubwayMap - Compact clickable subway map for the main screen
 */

import { Container, Graphics, Text, Circle } from 'pixi.js';
import type { City, Location } from '@engine/types';
import { BEIJING_LOCATIONS, SHANGHAI_LOCATIONS, getCityLabel } from '@engine/types';

type LinePath = {
  points: { x: number; y: number }[];
  color: number;
};

type StationLayout = {
  id: number;
  x: number;
  y: number;
  labelOffsetX: number;
  labelOffsetY: number;
  line: 'line1' | 'line2' | 'main';
  transfer?: boolean;
};

type MapLayout = {
  baseWidth: number;
  baseHeight: number;
  lines: LinePath[];
  stations: StationLayout[];
};

const BEIJING_LAYOUT: MapLayout = {
  baseWidth: 800,
  baseHeight: 520,
  lines: [
    {
      color: 0x2b7bff,
      points: [
        { x: 90, y: 320 },
        { x: 210, y: 320 },
        { x: 330, y: 320 },
        { x: 450, y: 320 },
        { x: 570, y: 320 },
        { x: 690, y: 320 },
      ],
    },
    {
      color: 0xff3b30,
      points: [
        { x: 330, y: 320 },
        { x: 330, y: 180 },
        { x: 450, y: 180 },
        { x: 570, y: 180 },
        { x: 570, y: 320 },
        { x: 570, y: 420 },
        { x: 330, y: 420 },
        { x: 330, y: 320 },
      ],
    },
  ],
  stations: [
    { id: 9, x: 90, y: 320, labelOffsetX: -22, labelOffsetY: -28, line: 'line1' },
    { id: 8, x: 210, y: 320, labelOffsetX: -22, labelOffsetY: 12, line: 'line1' },
    { id: 5, x: 330, y: 320, labelOffsetX: -22, labelOffsetY: -28, line: 'line1', transfer: true },
    { id: 20, x: 450, y: 320, labelOffsetX: -16, labelOffsetY: 12, line: 'line1' },
    { id: 0, x: 570, y: 320, labelOffsetX: -22, labelOffsetY: -28, line: 'line1', transfer: true },
    { id: 21, x: 690, y: 320, labelOffsetX: -16, labelOffsetY: 12, line: 'line1' },
    { id: 2, x: 330, y: 180, labelOffsetX: -24, labelOffsetY: -28, line: 'line2' },
    { id: 6, x: 450, y: 180, labelOffsetX: -24, labelOffsetY: -28, line: 'line2' },
    { id: 4, x: 570, y: 180, labelOffsetX: -24, labelOffsetY: -28, line: 'line2' },
    { id: 3, x: 330, y: 420, labelOffsetX: -24, labelOffsetY: 12, line: 'line2' },
    { id: 7, x: 450, y: 420, labelOffsetX: -24, labelOffsetY: 12, line: 'line2' },
    { id: 1, x: 570, y: 420, labelOffsetX: -24, labelOffsetY: 12, line: 'line2' },
  ],
};

const SHANGHAI_LAYOUT: MapLayout = {
  baseWidth: 800,
  baseHeight: 520,
  lines: [
    {
      color: 0xff8a00,
      points: [
        { x: 90, y: 280 },
        { x: 200, y: 280 },
        { x: 310, y: 280 },
        { x: 420, y: 280 },
        { x: 530, y: 280 },
        { x: 640, y: 280 },
        { x: 710, y: 280 },
        { x: 710, y: 360 },
        { x: 710, y: 420 },
      ],
    },
    {
      color: 0xff8a00,
      points: [
        { x: 420, y: 280 },
        { x: 420, y: 360 },
      ],
    },
  ],
  stations: [
    { id: 17, x: 90, y: 280, labelOffsetX: -24, labelOffsetY: -28, line: 'main' },
    { id: 16, x: 200, y: 280, labelOffsetX: -24, labelOffsetY: 12, line: 'main' },
    { id: 15, x: 310, y: 280, labelOffsetX: -24, labelOffsetY: -28, line: 'main' },
    { id: 14, x: 420, y: 280, labelOffsetX: -24, labelOffsetY: -28, line: 'main' },
    { id: 13, x: 530, y: 280, labelOffsetX: -24, labelOffsetY: 12, line: 'main' },
    { id: 12, x: 640, y: 280, labelOffsetX: -24, labelOffsetY: -28, line: 'main' },
    { id: 18, x: 710, y: 280, labelOffsetX: -24, labelOffsetY: -28, line: 'main' },
    { id: 10, x: 710, y: 360, labelOffsetX: -72, labelOffsetY: -6, line: 'main' },
    { id: 11, x: 710, y: 420, labelOffsetX: -24, labelOffsetY: 12, line: 'main' },
    { id: 19, x: 420, y: 360, labelOffsetX: -24, labelOffsetY: 12, line: 'main' },
  ],
};

export class SubwayMap extends Container {
  private mapWidth: number;
  private mapHeight: number;
  private background: Graphics;
  private mapLayer: Container;
  private currentCity: City | null = null;
  private currentLocationId: number | null = null;
  private cityLabel: Text;
  private placeholderText: Text;
  private stationHighlights: Map<number, Graphics> = new Map();
  private stationLabels: Map<number, Text> = new Map();
  private onSelect: (location: Location) => void;

  constructor(width: number, height: number, onSelect: (location: Location) => void) {
    super();
    this.mapWidth = width;
    this.mapHeight = height;
    this.onSelect = onSelect;

    this.background = new Graphics();
    this.background.roundRect(0, 0, width, height, 10);
    this.background.fill({ color: 0x1b222b, alpha: 0.9 });
    this.background.stroke({ width: 1, color: 0x2f3842 });
    this.addChild(this.background);

    this.cityLabel = new Text({
      text: '',
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 14,
        fill: 0xf8fafc,
        fontWeight: 'bold',
      }
    });
    this.cityLabel.x = 10;
    this.cityLabel.y = 8;
    this.addChild(this.cityLabel);

    this.mapLayer = new Container();
    this.addChild(this.mapLayer);

    this.placeholderText = new Text({
      text: '暂无地铁线路',
      style: {
        fontFamily: 'Microsoft YaHei, Arial',
        fontSize: 12,
        fill: 0x9aa4b2,
      }
    });
    this.placeholderText.anchor.set(0.5);
    this.placeholderText.x = this.mapWidth / 2;
    this.placeholderText.y = this.mapHeight / 2 + 10;
    this.placeholderText.visible = false;
    this.addChild(this.placeholderText);
  }

  setCity(city: City): void {
    if (this.currentCity === city) {
      return;
    }
    this.currentCity = city;
    const supportsMap = city === 'beijing' || city === 'shanghai';
    this.cityLabel.text = `${getCityLabel(city)}${supportsMap ? '地铁' : ''}`;
    this.mapLayer.visible = supportsMap;
    this.placeholderText.visible = !supportsMap;
    if (!supportsMap) {
      this.mapLayer.removeChildren();
      this.stationHighlights.clear();
      this.stationLabels.clear();
      return;
    }
    this.buildMap();
  }

  setCurrentLocation(locationId: number | null): void {
    this.currentLocationId = locationId;
    this.updateCurrentLocation();
  }

  private buildMap(): void {
    this.mapLayer.removeChildren();
    this.stationHighlights.clear();
    this.stationLabels.clear();

    const layout = this.currentCity === 'shanghai' ? SHANGHAI_LAYOUT : BEIJING_LAYOUT;
    const locations = this.currentCity === 'shanghai' ? SHANGHAI_LOCATIONS : BEIJING_LOCATIONS;
    const locationById = new Map<number, Location>();
    locations.forEach((location) => locationById.set(location.id, location));

    const padding = 8;
    const scale = Math.min(
      (this.mapWidth - padding * 2) / layout.baseWidth,
      (this.mapHeight - padding * 2) / layout.baseHeight
    );
    const offsetX = (this.mapWidth - layout.baseWidth * scale) / 2;
    const mapYOffset = -12;
    const offsetY = (this.mapHeight - layout.baseHeight * scale) / 2 + mapYOffset;
    const lineWidth = Math.max(2, Math.round(10 * scale));
    const stationRadius = Math.max(3, Math.round(9 * scale));
    const labelFontSize = Math.max(10, Math.round(16 * scale));
    const labelOffsetScale = Math.max(scale, 0.6);

    layout.lines.forEach((line) => {
      if (line.points.length < 2) {
        return;
      }
      const lineGraphic = new Graphics();
      lineGraphic.moveTo(
        offsetX + line.points[0].x * scale,
        offsetY + line.points[0].y * scale
      );
      for (let i = 1; i < line.points.length; i += 1) {
        lineGraphic.lineTo(
          offsetX + line.points[i].x * scale,
          offsetY + line.points[i].y * scale
        );
      }
      lineGraphic.stroke({ color: line.color, width: lineWidth, cap: 'round', join: 'round' });
      this.mapLayer.addChild(lineGraphic);
    });

    layout.stations.forEach((station) => {
      const location = locationById.get(station.id);
      if (!location) {
        return;
      }

      const stationX = offsetX + station.x * scale;
      const stationY = offsetY + station.y * scale;
      const stationColor =
        station.line === 'line2'
          ? 0xff3b30
          : station.line === 'main'
            ? 0xff8a00
            : 0x2b7bff;
      const strokeColor = station.transfer ? 0x111111 : stationColor;

      const stationContainer = new Container();
      stationContainer.x = stationX;
      stationContainer.y = stationY;
      stationContainer.eventMode = 'static';
      stationContainer.cursor = 'pointer';
      stationContainer.hitArea = new Circle(0, 0, Math.max(10, stationRadius + 6));

      const highlight = new Graphics();
      highlight.circle(0, 0, stationRadius + 4);
      highlight.stroke({ width: 3, color: 0xfacc15 });
      highlight.visible = false;
      stationContainer.addChild(highlight);
      this.stationHighlights.set(location.id, highlight);

      const dot = new Graphics();
      dot.circle(0, 0, stationRadius);
      dot.fill(0xffffff);
      dot.stroke({ width: 3, color: strokeColor });
      stationContainer.addChild(dot);

      const label = new Text({
        text: location.name,
        style: {
          fontFamily: 'Microsoft YaHei, Arial',
          fontSize: labelFontSize,
          fill: 0xdbeafe,
        }
      });
      label.x = station.labelOffsetX * labelOffsetScale;
      label.y = station.labelOffsetY * labelOffsetScale;
      stationContainer.addChild(label);
      this.stationLabels.set(location.id, label);

      stationContainer.on('pointerdown', () => {
        this.onSelect(location);
      });

      this.mapLayer.addChild(stationContainer);
    });

    this.updateCurrentLocation();
  }

  private updateCurrentLocation(): void {
    this.stationHighlights.forEach((highlight, id) => {
      highlight.visible = this.currentLocationId === id;
    });
    this.stationLabels.forEach((label, id) => {
      label.style.fill = this.currentLocationId === id ? 0xfacc15 : 0xdbeafe;
    });
  }
}
