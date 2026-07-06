export type OmnixErrorBody = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export const OMNIX_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  CONFIG_REVISION_STALE: 'CONFIG_REVISION_STALE',
  RUN_NOT_FOUND: 'RUN_NOT_FOUND',
  RUN_CANCELLED: 'RUN_CANCELLED',
} as const;
