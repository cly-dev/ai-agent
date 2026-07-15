/// <reference types="node" />
export declare const IMAGE_PANEL_VERSION: 1;
export type ImagePanelLayout = {
    rows: number;
    cols: number;
    cellPx: number;
    fit: 'contain';
};
export type ImagePanelCellStatus = 'ok' | 'fetch_failed';
export type ImagePanelCellManifest = {
    index: number;
    url: string;
    status: ImagePanelCellStatus;
    sourceSize?: {
        w: number;
        h: number;
    };
    fetchMs?: number;
    error?: string;
};
export type ImagePanelManifest = {
    panelVersion: typeof IMAGE_PANEL_VERSION;
    layout: ImagePanelLayout;
    cells: ImagePanelCellManifest[];
    omittedCount: number;
    omittedUrls: string[];
};
export type ImagePanelRenderTiming = {
    fetchMs: number;
    renderMs: number;
    totalMs: number;
};
export type ImagePanelRenderResult = {
    png: Buffer;
    width: number;
    height: number;
    manifest: ImagePanelManifest;
    timing: ImagePanelRenderTiming;
};
export type ImagePanelBuildOptions = {
    cellPx?: number;
    maxCells?: number;
    fetchTimeoutMs?: number;
    maxBytesPerImage?: number;
    fetchConcurrency?: number;
};
