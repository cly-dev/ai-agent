import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LlmModelConfigCacheStore } from '../llm/llm-model-config-cache.store';
import { OutboundHttpService } from '../outbound-http/outbound-http.service';
import type { ImagePanelBuildOptions, ImagePanelManifest, ImagePanelRenderResult } from './image-panel.types';
export type ImagePanelCellSummary = {
    index: number;
    url: string;
    status: 'ok' | 'fetch_failed' | 'skipped';
    summary?: string;
    legible?: boolean;
    cached?: boolean;
    error?: string;
    sourceSize?: {
        w: number;
        h: number;
    };
};
export type ImagePanelRecognizeResult = {
    panelVersion: number;
    layout: ImagePanelManifest['layout'];
    cells: ImagePanelCellSummary[];
    omittedCount: number;
    omittedUrls: string[];
    timing: {
        fetchMs: number;
        renderMs: number;
        visionMs: number;
        totalMs: number;
    };
    visionError?: string;
    model?: {
        id: number;
        model: string;
        baseUrl: string;
        endpoint: string;
    };
};
export type ImagePanelEntityGroupResult = {
    entityKey: string;
    path: string;
    contextText?: string;
    cells: ImagePanelCellSummary[];
    omittedCount: number;
    omittedUrls: string[];
    visionError?: string;
    timing: ImagePanelRecognizeResult['timing'];
};
export type ImagePanelGroupedRecognizeResult = {
    panelVersion: number;
    groups: ImagePanelEntityGroupResult[];
    cells: ImagePanelCellSummary[];
    omittedGroupCount: number;
    omittedGroups: Array<{
        entityKey: string;
        path: string;
        urlCount: number;
    }>;
    timing: ImagePanelRecognizeResult['timing'];
    visionError?: string;
};
export declare function getImagePanelService(): ImagePanelService | null;
export declare class ImagePanelService implements OnModuleInit, OnModuleDestroy {
    private readonly outbound;
    private readonly prisma;
    private readonly modelConfigCache;
    private readonly logger;
    private readonly summaryCache;
    constructor(outbound: OutboundHttpService, prisma: PrismaService, modelConfigCache: LlmModelConfigCacheStore);
    onModuleInit(): void;
    onModuleDestroy(): void;
    buildPanel(input: {
        urls: string[];
        options?: ImagePanelBuildOptions;
    }): Promise<ImagePanelRenderResult>;
    recognizeFromUrls(input: {
        urls: string[];
        maxCells?: number;
        cellPx?: number;
        hint?: string;
        objective?: string;
        cacheTtlSec?: number;
    }): Promise<ImagePanelRecognizeResult>;
    private readCache;
    private writeCache;
    private purgeExpiredCacheEntries;
    private evictCacheEntriesUntilRoom;
    private resolveActiveChatConfig;
    private resolveChatCompletionsUrl;
}
