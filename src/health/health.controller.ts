import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/health')
  health() {
    return {
      service: 'levelab-backend',
      version: '0.1.0',
      status: 'ONLINE',
    };
  }

  @Get('/ready')
  ready() {
    return {
      service: 'levelab-backend',
      status: 'READY',
    };
  }
}
