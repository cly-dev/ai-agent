import { Logger } from '@nestjs/common';

export function registerProcessErrorHandlers(): void {
  process.on('uncaughtException', (error: Error) => {
    Logger.error('Uncaught exception', error.stack ?? error.message);
  });
  process.on('unhandledRejection', (reason: unknown) => {
    if (reason instanceof Error) {
      Logger.error(
        'Unhandled promise rejection',
        reason.stack ?? reason.message,
      );
      return;
    }
    Logger.error('Unhandled promise rejection', String(reason));
  });
}
