/// <reference types="node" />
import { type ImagePanelManifest } from './image-panel.types';
export type PanelTileInput = {
    index: number;
    url: string;
    status: 'ok' | 'fetch_failed';
    bytes?: Buffer;
    sourceSize?: {
        w: number;
        h: number;
    };
    fetchMs?: number;
    error?: string;
};
export declare function renderImagePanelPng(input: {
    tiles: PanelTileInput[];
    cellPx?: number;
    omittedUrls?: string[];
}): Promise<{
    png: Buffer;
    width: number;
    height: number;
    manifest: ImagePanelManifest;
    renderMs: number;
}>;
