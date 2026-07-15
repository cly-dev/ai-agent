/**
 * Demo 专用：把 IMAGE_PANEL 送给 OpenAI-compatible 多模态 chat。
 * 不改主链路 LlmChatMessage（仍是 string）；效果验证通过后再考虑正式接入。
 */

export const IMAGE_PANEL_VISION_SYSTEM = `你是图像理解助手。用户会提供一张 IMAGE_PANEL/v1 多图网格（带 #编号），以及 cells 清单。
规则：
1. 这是多图面板，不是单张自然照片；必须按 cells[].index 逐格描述。
2. 禁止把多格内容合并成一张图的描述。
3. 某格看不清写 illegible，不要编造文字/数字。
4. status=fetch_failed 的格不要臆造画面。
5. 只输出 JSON，不要 Markdown 围栏或其它散文。`;

export function buildImagePanelVisionUserText(manifestJson: string): string {
  return `请识别下面这张 IMAGE_PANEL，并严格按编号输出 JSON：
{"panelVersion":1,"cells":[{"index":1,"summary":"...","legible":true}]}

cells 清单（URL 映射真源）：
${manifestJson}`;
}

export type VisionChatMessageContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export function buildImagePanelVisionMessages(input: {
  panelDataUrl: string;
  manifestJson: string;
}): Array<{
  role: 'system' | 'user';
  content: string | VisionChatMessageContentPart[];
}> {
  return [
    { role: 'system', content: IMAGE_PANEL_VISION_SYSTEM },
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

/** 尽量从模型输出里抠出 JSON 对象，便于 demo 展示。 */
export function tryParseVisionJson(text: string): unknown | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    // continue
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // continue
    }
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }
  return null;
}
