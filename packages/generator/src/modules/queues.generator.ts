import type { GyxerProject } from '@gyxer-studio/schema';

/**
 * Get queues module options from project config.
 */
function getQueuesOptions(project: GyxerProject): { queueName: string; concurrency: number } {
  const mod = project.modules?.find(
    (m) => m.name === 'queues' && m.enabled !== false,
  );
  return {
    queueName: (mod?.options?.queueName as string) || 'default',
    concurrency: (mod?.options?.concurrency as number) || 5,
  };
}

/**
 * Generate all files needed for the Queues module.
 */
export function generateQueuesFiles(project: GyxerProject): Map<string, string> {
  const files = new Map<string, string>();
  const opts = getQueuesOptions(project);

  files.set('src/queues/queues.module.ts', generateQueuesModule(opts));
  files.set('src/queues/queues.service.ts', generateQueuesService(opts));
  files.set('src/queues/queues.processor.ts', generateQueuesProcessor(opts));
  files.set('src/queues/dto/add-job.dto.ts', generateAddJobDto());

  return files;
}

// ─── Queues Module ──────────────────────────────────────────

function generateQueuesModule(opts: { queueName: string }): string {
  return `import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueuesService } from './queues.service';
import { QueuesProcessor } from './queues.processor';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    BullModule.registerQueue({
      name: '${opts.queueName}',
    }),
  ],
  providers: [QueuesService, QueuesProcessor],
  exports: [QueuesService],
})
export class QueuesModule {}
`;
}

// ─── Queues Service ─────────────────────────────────────────

function generateQueuesService(opts: { queueName: string }): string {
  return `import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueuesService {
  constructor(
    @InjectQueue('${opts.queueName}') private readonly queue: Queue,
  ) {}

  /**
   * Add a job to the queue.
   */
  async addJob(name: string, data: Record<string, unknown>, opts?: { delay?: number; priority?: number }) {
    return this.queue.add(name, data, {
      delay: opts?.delay,
      priority: opts?.priority,
    });
  }

  /**
   * Get all waiting jobs.
   */
  async getWaiting() {
    return this.queue.getWaiting();
  }

  /**
   * Get all completed jobs.
   */
  async getCompleted() {
    return this.queue.getCompleted();
  }

  /**
   * Get all failed jobs.
   */
  async getFailed() {
    return this.queue.getFailed();
  }
}
`;
}

// ─── Queues Processor ───────────────────────────────────────

function generateQueuesProcessor(opts: { queueName: string; concurrency: number }): string {
  return `import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('${opts.queueName}', { concurrency: ${opts.concurrency} })
export class QueuesProcessor extends WorkerHost {
  private readonly logger = new Logger(QueuesProcessor.name);

  async process(job: Job): Promise<any> {
    this.logger.log(\`Processing job \${job.id} of type \${job.name}\`);
    this.logger.debug(\`Job data: \${JSON.stringify(job.data)}\`);

    // TODO: Implement your job processing logic here
    switch (job.name) {
      case 'example':
        return this.handleExample(job.data);
      default:
        this.logger.warn(\`Unknown job type: \${job.name}\`);
    }
  }

  private async handleExample(data: Record<string, unknown>) {
    this.logger.log(\`Handling example job with data: \${JSON.stringify(data)}\`);
    // Add your processing logic here
    return { success: true };
  }
}
`;
}

// ─── DTOs ───────────────────────────────────────────────────

function generateAddJobDto(): string {
  return `import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject, IsNumber } from 'class-validator';

export class AddJobDto {
  @ApiProperty({ example: 'example', description: 'Job name/type' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: { key: 'value' }, description: 'Job payload data' })
  @IsObject()
  data: Record<string, unknown>;

  @ApiProperty({ required: false, example: 5000, description: 'Delay in ms before processing' })
  @IsOptional()
  @IsNumber()
  delay?: number;

  @ApiProperty({ required: false, example: 1, description: 'Job priority (lower = higher priority)' })
  @IsOptional()
  @IsNumber()
  priority?: number;
}
`;
}

// ─── Dependencies ───────────────────────────────────────────

export function getQueuesDependencies(): Record<string, string> {
  return {
    '@nestjs/bullmq': '^11.0.0',
    'bullmq': '^5.50.0',
  };
}

export function getQueuesEnvVars(): string {
  return `REDIS_HOST=localhost
REDIS_PORT=6379
`;
}
