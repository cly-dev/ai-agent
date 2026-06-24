import { isProductionRuntime } from './runtime-env.util';

const INSECURE_JWT_SECRETS = new Set([
  'dev-jwt-secret',
  'change-me',
  'secret',
  'jwt-secret',
]);

const MIN_JWT_SECRET_LENGTH = 32;

export function assertJwtSecretConfigured(): void {
  const raw = process.env.JWT_SECRET?.trim() ?? '';
  if (!raw) {
    if (isProductionRuntime()) {
      throw new Error(
        'JWT_SECRET is required in production. Set a strong random secret (≥32 chars).',
      );
    }
    process.env.JWT_SECRET = 'dev-jwt-secret';
    return;
  }

  if (!isProductionRuntime()) {
    return;
  }

  if (raw.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters in production.`,
    );
  }

  if (INSECURE_JWT_SECRETS.has(raw.toLowerCase())) {
    throw new Error(
      'JWT_SECRET uses a known insecure default. Set a strong random secret in production.',
    );
  }
}
