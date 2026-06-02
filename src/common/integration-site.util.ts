/** 商品等集成 API 的站点头 `X-SHOP-ID`（OpenAPI 多为 integer）。 */

const DEFAULT_US_SHOP_ID = 2022;
const DEFAULT_CA_SHOP_ID = 2023;

export function getDefaultXShopId(): number {
  const raw = process.env.AGENT_DEFAULT_X_SHOP_ID?.trim();
  if (raw) {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return DEFAULT_US_SHOP_ID;
}

export function getCanadaXShopId(): number {
  const raw = process.env.AGENT_CA_X_SHOP_ID?.trim();
  if (raw) {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return DEFAULT_CA_SHOP_ID;
}

/** 从用户话术推断站点；未指明时返回默认 US。 */
export function resolveXShopIdFromUserMessage(userMessage: string): number {
  const text = userMessage.trim().toLowerCase();
  if (
    text.includes('加拿大') ||
    text.includes('canada') ||
    /\bca\b/.test(text) ||
    text.includes('ca站点') ||
    text.includes('ca站')
  ) {
    return getCanadaXShopId();
  }
  return getDefaultXShopId();
}

export function buildIntegrationSiteSystemBlock(): string {
  const us = getDefaultXShopId();
  const ca = getCanadaXShopId();
  return [
    '<integration_site>',
    '调用商品相关工具时必须在请求头携带 X-SHOP-ID（整数，OpenAPI header 参数）。',
    `未说明站点时默认 US：X-SHOP-ID=${us}。`,
    `用户明确加拿大/CA 站点时使用：X-SHOP-ID=${ca}。`,
    '勿使用 us-2022 等字符串；与 OpenAPI 定义一致传整数。',
    '当前会话站点偏好应写入 working_memory.entities.xShopId。',
    '</integration_site>',
  ].join('\n');
}
