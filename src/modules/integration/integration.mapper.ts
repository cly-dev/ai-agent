import type { IntegrationDetailRow, IntegrationResponse } from './integration.types';

export function toIntegrationResponse(
  row: IntegrationDetailRow,
): IntegrationResponse {
  const { apiKey, ...safe } = row;
  return {
    ...safe,
    toolCount: row._count?.tools ?? 0,
    systemConfigured: Boolean(apiKey?.trim()),
  };
}

export function toIntegrationResponseList(
  rows: IntegrationDetailRow[],
): IntegrationResponse[] {
  return rows.map(toIntegrationResponse);
}
