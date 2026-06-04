import { BadRequestException } from '@nestjs/common';

const CAPABILITY_KEY_PATTERN = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)*$/;

export function normalizeCapabilityKey(
  value: string | null | undefined,
): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }
  if (!CAPABILITY_KEY_PATTERN.test(trimmed)) {
    throw new BadRequestException(
      'capabilityKey must be lowercase segments separated by dots, e.g. order.inquiry',
    );
  }
  return trimmed;
}
