"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderImagePanelPng = void 0;
const image_panel_layout_util_1 = require("./image-panel-layout.util");
const image_panel_types_1 = require("./image-panel.types");
const sharp_loader_util_1 = require("./sharp-loader.util");
const HEADER_H = 48;
const CELL_PAD = 4;
const DEFAULT_CELL_PX = 512;
const CANVAS_BG = '#2b2b2b';
const CELL_BG = '#3a3a3a';
const BORDER = '#6b7280';
function escapeXml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function headerSvg(width, layoutLabel, cellCount) {
    const label = escapeXml(`IMAGE_PANEL/v1 | layout=${layoutLabel} | cells=${cellCount}`);
    return Buffer.from(`
<svg width="${width}" height="${HEADER_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#111827"/>
  <text x="16" y="30" font-size="18" fill="#f9fafb" font-family="ui-sans-serif, system-ui, sans-serif">${label}</text>
</svg>`);
}
function indexLabelSvg(index) {
    const text = `#${index}`;
    return Buffer.from(`
<svg width="72" height="36" xmlns="http://www.w3.org/2000/svg">
  <rect width="72" height="36" rx="6" fill="#000000" fill-opacity="0.72"/>
  <text x="10" y="25" font-size="20" font-weight="700" fill="#ffffff" font-family="ui-sans-serif, system-ui, sans-serif">${text}</text>
</svg>`);
}
function failedPlaceholderSvg(size) {
    return Buffer.from(`
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${CELL_BG}"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
    font-size="22" fill="#fca5a5" font-family="ui-sans-serif, system-ui, sans-serif">FETCH_FAILED</text>
</svg>`);
}
function urlTailSvg(width, url) {
    var _a;
    let tail = url;
    try {
        const parsed = new URL(url);
        tail = (_a = parsed.pathname.split('/').filter(Boolean).pop()) !== null && _a !== void 0 ? _a : parsed.hostname;
    }
    catch (_b) {
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
async function renderImagePanelPng(input) {
    var _a;
    const started = Date.now();
    const sharp = (0, sharp_loader_util_1.requireSharp)();
    const cellPx = input.cellPx && input.cellPx > 0 ? Math.floor(input.cellPx) : DEFAULT_CELL_PX;
    const tiles = input.tiles;
    const { rows, cols } = (0, image_panel_layout_util_1.layoutForCount)(Math.max(tiles.length, 1));
    const width = cols * cellPx;
    const height = HEADER_H + rows * cellPx;
    const inner = Math.max(8, cellPx - CELL_PAD * 2);
    const composites = [];
    composites.push({
        input: headerSvg(width, `${rows}x${cols}`, tiles.length),
        left: 0,
        top: 0,
    });
    const cells = [];
    for (let i = 0; i < rows * cols; i += 1) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const left = col * cellPx;
        const top = HEADER_H + row * cellPx;
        const tile = tiles[i];
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
        }
        else {
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
    const omittedUrls = (_a = input.omittedUrls) !== null && _a !== void 0 ? _a : [];
    return {
        png,
        width,
        height,
        renderMs: Date.now() - started,
        manifest: {
            panelVersion: image_panel_types_1.IMAGE_PANEL_VERSION,
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
exports.renderImagePanelPng = renderImagePanelPng;
//# sourceMappingURL=image-panel-render.util.js.map