import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { ApiKeyProtected } from '../auth/api-key.decorator';
import { RequiresScopes } from '../auth/scopes.decorator';

// Swagger (optional)
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Jobs')
@ApiHeader({ name: 'x-api-key', description: 'API key', required: true })
@ApiKeyProtected()
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  // Create a test job (handy for local testing)
  @Post()
  @RequiresScopes('write:jobs')
  @ApiOperation({ summary: 'Create a test job (local testing)' })
  async createTest(@Body() body: any, @Req() req: any) {
    const job = await this.jobs.addTestJob(
      { ...body, tenantId: req.auth?.tenantId },
      { removeOnComplete: { age: 3600, count: 1000 }, removeOnFail: { age: 3600, count: 1000 } },
    );
    return { id: String(job.id), queue: job.queueName, name: job.name };
  }

  // List jobs with simple filters/pagination
  @Get()
  @RequiresScopes('read:jobs')
  @ApiOperation({ summary: 'List jobs (filters & cursor pagination)' })
  @ApiQuery({ name: 'state', required: false, description: 'waiting|active|completed|failed|delayed|paused' })
  @ApiQuery({ name: 'name', required: false, description: 'Filter by job name' })
  @ApiQuery({ name: 'cursor', required: false, description: 'Start index (0-based)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Page size (1-100)' })
  @ApiQuery({ name: 'asc', required: false, description: 'Sort ascending (true/false)' })
  async list(
    @Query('state') state?: string,
    @Query('name') name?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('asc') asc?: string,
  ) {
    return this.jobs.list({
      state: state?.trim() || undefined,
      name: name?.trim() || undefined,
      cursor: cursor ? Number(cursor) : undefined,
      limit: limit ? Number(limit) : undefined,
      asc: asc === '1' || asc === 'true',
    });
  }

  // Summary (counts per state + recent)
  @Get('summary')
  @RequiresScopes('read:jobs')
  @ApiOperation({ summary: 'Counts per state + recent activity' })
  @ApiQuery({ name: 'recentPerState', required: false, description: 'How many recent jobs per state (default 25, max 200)' })
  @ApiQuery({ name: 'lookbackMs', required: false, description: 'Lookback window in milliseconds (default 24h)' })
  async summary(
    @Query('recentPerState') recentPerState?: string,
    @Query('lookbackMs') lookbackMs?: string,
  ) {
    return this.jobs.summary({
      recentPerState: recentPerState ? Number(recentPerState) : undefined,
      lookbackMs: lookbackMs ? Number(lookbackMs) : undefined,
    });
  }

  // Get a job by id
  @Get(':id')
  @RequiresScopes('read:jobs')
  @ApiOperation({ summary: 'Get job by id' })
  async getOne(@Param('id') id: string) {
    const job = await this.jobs.getJob(id);
    const state = await job.getState();
    return this.jobs.toDTO(job, state);
  }

  // Retry a job
  @Post(':id/retry')
  @RequiresScopes('write:jobs')
  @ApiOperation({ summary: 'Retry a job (failed → retry; completed → requeue; waiting/delayed → noop)' })
  async retry(@Param('id') id: string) {
    return this.jobs.retryJob(id);
  }

  // Cancel a job
  @Post(':id/cancel')
  @RequiresScopes('write:jobs')
  @ApiOperation({ summary: 'Cancel a job (remove waiting/delayed/paused; flag active)' })
  async cancel(@Param('id') id: string) {
    return this.jobs.cancelJob(id);
  }

  // Hard remove a job
  @Delete(':id')
  @RequiresScopes('write:jobs')
  @ApiOperation({ summary: 'Hard remove a job' })
  async remove(@Param('id') id: string) {
    return this.jobs.removeJob(id);
  }

  // Alias for hard remove (POST)
  @Post(':id/remove')
  @RequiresScopes('write:jobs')
  @ApiOperation({ summary: 'Alias of hard remove' })
  async removeAlias(@Param('id') id: string) {
    return this.jobs.removeJob(id);
  }
}
