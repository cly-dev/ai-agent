import { Controller, Get } from '@nestjs/common';
import { OMNIX_SERVICES } from '@omnix/protocol';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return {
      ok: true,
      service: OMNIX_SERVICES.api.name,
      port: OMNIX_SERVICES.api.port,
      role: 'admin_and_config',
    };
  }
}
