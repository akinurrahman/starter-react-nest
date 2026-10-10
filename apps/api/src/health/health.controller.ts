import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiDataResponse, ApiErrorResponses } from '../common/swagger/index.js';
import {
  HealthDto,
  ReadinessDto,
  type Health,
  type Readiness,
} from './health.dto.js';
import { HealthService } from './health.service.js';

// Probes poll on a fixed schedule; throttling them could fail a healthy pod.
@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiDataResponse(HealthDto)
  liveness(): Health {
    return this.health.liveness();
  }

  @Get('ready')
  @ApiDataResponse(ReadinessDto)
  @ApiErrorResponses(503)
  readiness(): Promise<Readiness> {
    return this.health.readiness();
  }
}
