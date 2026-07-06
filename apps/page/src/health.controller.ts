import { Controller, Get } from '@nestjs/common';
import { OMNIX_SERVICES } from '@omnix/protocol';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return {
      ok: true,
      service: OMNIX_SERVICES.page.name,
      port: OMNIX_SERVICES.page.port,
      role: 'page_action_and_page_agent',
    };
  }
}
