"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryParseVisionJson = exports.buildImagePanelVisionMessages = exports.buildImagePanelVisionUserText = exports.IMAGE_PANEL_VISION_SYSTEM = void 0;
exports.IMAGE_PANEL_VISION_SYSTEM = `你是图像理解助手。用户会提供一张 IMAGE_PANEL/v1 多图网格（带 #编号），以及 cells 清单。
规则：
1. 这是多图面板，不是单张自然照片；必须按 cells[].index 逐格描述。
2. 禁止把多格内容合并成一张图的描述。
3. 某格看不清写 illegible，不要编造文字/数字。
4. status=fetch_failed 的格不要臆造画面。
5. 只输出 JSON，不要 Markdown 围栏或其它散文。`;
function buildImagePanelVisionUserText(manifestJson) {
    return `请识别下面这张 IMAGE_PANEL，并严格按编号输出 JSON：
{"panelVersion":1,"cells":[{"index":1,"summary":"...","legible":true}]}

cells 清单（URL 映射真源）：
${manifestJson}`;
}
exports.buildImagePanelVisionUserText = buildImagePanelVisionUserText;
function buildImagePanelVisionMessages(input) {
    return [
        { role: 'system', content: exports.IMAGE_PANEL_VISION_SYSTEM },
        {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: buildImagePanelVisionUserText(input.manifestJson),
                },
                {
                    type: 'image_url',
                    image_url: { url: input.panelDataUrl },
                },
            ],
        },
    ];
}
exports.buildImagePanelVisionMessages = buildImagePanelVisionMessages;
function tryParseVisionJson(text) {
    const trimmed = text.trim();
    if (!trimmed) {
        return null;
    }
    try {
        return JSON.parse(trimmed);
    }
    catch (_a) {
    }
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced === null || fenced === void 0 ? void 0 : fenced[1]) {
        try {
            return JSON.parse(fenced[1].trim());
        }
        catch (_b) {
        }
    }
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
        try {
            return JSON.parse(trimmed.slice(start, end + 1));
        }
        catch (_c) {
            return null;
        }
    }
    return null;
}
exports.tryParseVisionJson = tryParseVisionJson;
//# sourceMappingURL=image-panel-vision-demo.util.js.map