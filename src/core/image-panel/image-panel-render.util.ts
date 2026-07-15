import { layoutForCount } from './image-panel-layout.util';
import {
  IMAGE_PANEL_VERSION,
  type ImagePanelCellManifest,
  type ImagePanelManifest,
} from './image-panel.types';
import { requireSharp } from './sharp-loader.util';

type SharpOverlay = {
  input: Buffer;
  left: number;
  top: number;
};

const HEADER_H = 48;
const CELL_PAD = 4;
const DEFAULT_CELL_PX = 512;
const CANVAS_BG = '#2b2b2b';
const CELL_BG = '#3a3a3a';
const BORDER = '#6b7280';

export type PanelTileInput = {
  index: number;
  url: string;
  status: 'ok' | 'fetch_failed';
  bytes?: Buffer;
  sourceSize?: { w: number; h: number };
  fetchMs?: number;
  error?: string;
};

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function headerSvg(width: number, layoutLabel: string, cellCount: number): Buffer {
  const label = escapeXml(
    `IMAGE_PANEL/v1 | layout=${layoutLabel} | cells=${cellCount}`,
  );
  return Buffer.from(`
<svg width="${width}" height="${HEADER_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#111827"/>
  <text x="16" y="30" font-size="18" fill="#f9fafb" font-family="ui-sans-serif, system-ui, sans-serif">${label}</text>
</svg>`);
}

function indexLabelSvg(index: number): Buffer {
  const text = `#${index}`;
  return Buffer.from(`
<svg width="72" height="36" xmlns="http://www.w3.org/2000/svg">
  <rect width="72" height="36" rx="6" fill="#000000" fill-opacity="0.72"/>
  <text x="10" y="25" font-size="20" font-weight="700" fill="#ffffff" font-family="ui-sans-serif, system-ui, sans-serif">${text}</text>
</svg>`);
}

function failedPlaceholderSvg(size: number): Buffer {
  return Buffer.from(`
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${CELL_BG}"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
    font-size="22" fill="#fca5a5" font-family="ui-sans-serif, system-ui, sans-serif">FETCH_FAILED</text>
</svg>`);
}

function urlTailSvg(width: number, url: string): Buffer {
  let tail = url;
  try {
    const parsed = new URL(url);
    tail = parsed.pathname.split('/').filter(Boolean).pop() ?? parsed.hostname;
  } catch {
    // keep raw
  }
  if (tail.length > 28) {
    tail = `${tail.slice(0, 25)}…`;
  }
  return Buffer.from(`
<svg width="${width}" height="28" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#000000" fill-opacity="0.55"/>
  <text x="8" y="19" font-size="12" fill="#e5e7eb" font-family="ui-sans-serif, system-ui, sans-serif">${escapeXml(tail)}</text>
</svg>`);
}

/**
 * 将不定尺寸原图按 IMAGE_PANEL/v1 规则拼成带编号网格。
 * 几何由固定 cell 决定；原图 fit=contain，禁止 stretch。
 */
export async function renderImagePanelPng(input: {
  tiles: PanelTileInput[];
  cellPx?: number;
  omittedUrls?: string[];
}): Promise<{
  png: Buffer;
  width: number;
  height: number;
  manifest: ImagePanelManifest;
  renderMs: number;
}> {
  const started = Date.now();
  const sharp = requireSharp();
  const cellPx = input.cellPx && input.cellPx > 0 ? Math.floor(input.cellPx) : DEFAULT_CELL_PX;
  const tiles = input.tiles;
  const { rows, cols } = layoutForCount(Math.max(tiles.length, 1));
  const width = cols * cellPx;
  const height = HEADER_H + rows * cellPx;
  const inner = Math.max(8, cellPx - CELL_PAD * 2);

  const composites: SharpOverlay[] = [];
  composites.push({
    input: headerSvg(width, `${rows}x${cols}`, tiles.length),
    left: 0,
    top: 0,
  });

  const cells: ImagePanelCellManifest[] = [];

  for (let i = 0; i < rows * cols; i += 1) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const left = col * cellPx;
    const top = HEADER_H + row * cellPx;
    const tile = tiles[i];

    // 空位也画格底，保持协议网格完整可读
    const emptyCell = await sharp({
      create: {
        width: cellPx,
        height: cellPx,
        channels: 3,
        background: CELL_BG,
      },
    })
      .png()
      .toBuffer();
    composites.push({ input: emptyCell, left, top });

    if (!tile) {
      continue;
    }

    if (tile.status === 'ok' && tile.bytes && tile.bytes.length > 0) {
      const fitted = await sharp(tile.bytes)
        .rotate()
        .resize(inner, inner, {
          fit: 'contain',
          background: CELL_BG,
        })
        .png()
        .toBuffer();
      composites.push({
        input: fitted,
        left: left + CELL_PAD,
        top: top + CELL_PAD,
      });
    } else {
      composites.push({
        input: failedPlaceholderSvg(inner),
        left: left + CELL_PAD,
        top: top + CELL_PAD,
      });
    }

    composites.push({
      input: indexLabelSvg(tile.index),
      left: left + 8,
      top: top + 8,
    });
    composites.push({
      input: urlTailSvg(cellPx, tile.url),
      left,
      top: top + cellPx - 28,
    });

    // 格线：四边 2px 矩形描边感
    const borderSvg = Buffer.from(`
<svg width="${cellPx}" height="${cellPx}" xmlns="http://www.w3.org/2000/svg">
  <rect x="1" y="1" width="${cellPx - 2}" height="${cellPx - 2}" fill="none" stroke="${BORDER}" stroke-width="2"/>
</svg>`);
    composites.push({ input: borderSvg, left, top });

    cells.push({
      index: tile.index,
      url: tile.url,
      status: tile.status,
      sourceSize: tile.sourceSize,
      fetchMs: tile.fetchMs,
      error: tile.error,
    });
  }

  const png = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: CANVAS_BG,
    },
  })
    .composite(composites)
    .png()
    .toBuffer();

  const omittedUrls = input.omittedUrls ?? [];
  return {
    png,
    width,
    height,
    renderMs: Date.now() - started,
    manifest: {
      panelVersion: IMAGE_PANEL_VERSION,
      layout: {
        rows,
        cols,
        cellPx,
        fit: 'contain',
      },
      cells,
      omittedCount: omittedUrls.length,
      omittedUrls,
    },
  };
}
