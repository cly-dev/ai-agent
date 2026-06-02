import type { IntegrationDetailRow, IntegrationResponse } from './integration.types';

export function toIntegrationResponse(
  row: IntegrationDetailRow,
): IntegrationResponse {
  return {
    ...row,
    toolCount: row._count?.tools ?? 0,
    systemConfigured: Boolean(row.apiKey?.trim()),
  };
}

export function toIntegrationResponseList(
  rows: IntegrationDetailRow[],
): IntegrationResponse[] {
  return rows.map(toIntegrationResponse);
}
