import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiDataResponse, ApiErrorResponses } from '../common/swagger/index.js';
import {
  HealthDto,
  ReadinessDto,
  type Health,
  type Readiness,
} from './health.dto.js';
import { HealthService } from './health.service.js';

@ApiTags('health')
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
