import { OutboundHttpService } from '../outbound-http/outbound-http.service';
import type { ImagePanelBuildOptions, ImagePanelRenderResult } from './image-panel.types';
export declare function buildImagePanelFromUrls(input: {
    urls: string[];
    outbound: OutboundHttpService;
    options?: ImagePanelBuildOptions;
}): Promise<ImagePanelRenderResult>;
