import { RecognizeImagePanelDto, StitchImagePanelDto } from './dto/stitch-image-panel.dto';
import { ImagePanelDemoService } from './image-panel-demo.service';
export declare class ImagePanelDemoController {
    private readonly service;
    constructor(service: ImagePanelDemoService);
    stitch(dto: StitchImagePanelDto): Promise<import("./image-panel-demo.service").ImagePanelDemoStitchResponse>;
    recognize(dto: RecognizeImagePanelDto): Promise<import("./image-panel-demo.service").ImagePanelDemoRecognizeResponse>;
}
