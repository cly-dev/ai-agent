import { LlmModelConfigCacheStore } from '../llm/llm-model-config-cache.store';
import { OutboundHttpService } from '../outbound-http/outbound-http.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { ImagePanelManifest } from './image-panel.types';
export type ImagePanelDemoStitchResponse = {
    panelVersion: number;
    width: number;
    height: number;
    bytes: number;
    timing: {
        fetchMs: number;
        renderMs: number;
        totalMs: number;
        clientRoundTripHint: string;
    };
    manifest: ImagePanelManifest;
    panelDataUrl: string;
};
export type ImagePanelDemoRecognizeResponse = ImagePanelDemoStitchResponse & {
    model: {
        id: number;
        provider: string;
        model: string;
        baseUrl: string;
        endpoint?: string;
    };
    timing: ImagePanelDemoStitchResponse['timing'] & {
        visionMs: number;
        stitchMs: number;
    };
    visionImageBytes: number;
    visionRawText: string;
    visionParsed: unknown | null;
};
export declare class ImagePanelDemoService {
    private readonly outbound;
    private readonly prisma;
    private readonly modelConfigCache;
    private readonly logger;
    constructor(outbound: OutboundHttpService, prisma: PrismaService, modelConfigCache: LlmModelConfigCacheStore);
    assertDemoEnabled(): void;
    stitch(input: {
        urls: string[];
        cellPx?: number;
        maxCells?: number;
    }): Promise<ImagePanelDemoStitchResponse>;
    recognize(input: {
        urls: string[];
        cellPx?: number;
        maxCells?: number;
        hint?: string;
    }): Promise<ImagePanelDemoRecognizeResponse>;
    private buildPanel;
    private toStitchResponse;
    private resolveActiveChatConfig;
    private resolveChatCompletionsUrl;
}
