export declare class StitchImagePanelDto {
    urls: string[];
    cellPx?: number;
    maxCells?: number;
}
export declare class RecognizeImagePanelDto extends StitchImagePanelDto {
    hint?: string;
}
