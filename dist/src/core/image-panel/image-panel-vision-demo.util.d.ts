export declare const IMAGE_PANEL_VISION_SYSTEM = "\u4F60\u662F\u56FE\u50CF\u7406\u89E3\u52A9\u624B\u3002\u7528\u6237\u4F1A\u63D0\u4F9B\u4E00\u5F20 IMAGE_PANEL/v1 \u591A\u56FE\u7F51\u683C\uFF08\u5E26 #\u7F16\u53F7\uFF09\uFF0C\u4EE5\u53CA cells \u6E05\u5355\u3002\n\u89C4\u5219\uFF1A\n1. \u8FD9\u662F\u591A\u56FE\u9762\u677F\uFF0C\u4E0D\u662F\u5355\u5F20\u81EA\u7136\u7167\u7247\uFF1B\u5FC5\u987B\u6309 cells[].index \u9010\u683C\u63CF\u8FF0\u3002\n2. \u7981\u6B62\u628A\u591A\u683C\u5185\u5BB9\u5408\u5E76\u6210\u4E00\u5F20\u56FE\u7684\u63CF\u8FF0\u3002\n3. \u67D0\u683C\u770B\u4E0D\u6E05\u5199 illegible\uFF0C\u4E0D\u8981\u7F16\u9020\u6587\u5B57/\u6570\u5B57\u3002\n4. status=fetch_failed \u7684\u683C\u4E0D\u8981\u81C6\u9020\u753B\u9762\u3002\n5. \u53EA\u8F93\u51FA JSON\uFF0C\u4E0D\u8981 Markdown \u56F4\u680F\u6216\u5176\u5B83\u6563\u6587\u3002";
export declare function buildImagePanelVisionUserText(manifestJson: string): string;
export type VisionChatMessageContentPart = {
    type: 'text';
    text: string;
} | {
    type: 'image_url';
    image_url: {
        url: string;
    };
};
export declare function buildImagePanelVisionMessages(input: {
    panelDataUrl: string;
    manifestJson: string;
}): Array<{
    role: 'system' | 'user';
    content: string | VisionChatMessageContentPart[];
}>;
export declare function tryParseVisionJson(text: string): unknown | null;
