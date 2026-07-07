import { BadRequestException } from '@nestjs/common';
import { PAGE_ACTION_PROMPT_LIMITS } from './page-action.constants';

export function assertPageActionPromptLimits(input: {
  systemPrompt: string;
  instruction?: string | null;
  context?: Record<string, unknown> | null;
}): void {
  if (input.systemPrompt.length > PAGE_ACTION_PROMPT_LIMITS.systemPromptMax) {
    throw new BadRequestException({
      code: 'PROMPT_TOO_LARGE',
      message: 'systemPrompt exceeds limit',
    });
  }
  const instruction = input.instruction?.trim();
  if (
    instruction &&
    instruction.length > PAGE_ACTION_PROMPT_LIMITS.instructionMax
  ) {
    throw new BadRequestException({
      code: 'PROMPT_TOO_LARGE',
      message: 'instruction exceeds limit',
    });
  }
  if (input.context) {
    const serialized = JSON.stringify(input.context);
    if (serialized.length > PAGE_ACTION_PROMPT_LIMITS.contextJsonMax) {
      throw new BadRequestException({
        code: 'PROMPT_TOO_LARGE',
        message: 'context exceeds limit',
      });
    }
  }
}
