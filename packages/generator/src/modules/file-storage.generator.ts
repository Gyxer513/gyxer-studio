import type { GyxerProject } from '@gyxer-studio/schema';

/**
 * Get file-storage module options from project config.
 */
function getStorageOptions(project: GyxerProject): {
  provider: 'minio' | 's3';
  bucket: string;
  maxFileSize: number;
} {
  const mod = project.modules?.find(
    (m) => m.name === 'file-storage' && m.enabled !== false,
  );
  return {
    provider: (mod?.options?.provider as 'minio' | 's3') || 'minio',
    bucket: (mod?.options?.bucket as string) || 'uploads',
    maxFileSize: (mod?.options?.maxFileSize as number) || 5,
  };
}

/**
 * Generate all files needed for the File Storage module.
 */
export function generateFileStorageFiles(project: GyxerProject): Map<string, string> {
  const files = new Map<string, string>();
  const opts = getStorageOptions(project);

  files.set('src/storage/storage.module.ts', generateStorageModule(opts));
  files.set('src/storage/storage.service.ts', generateStorageService(opts));
  files.set('src/storage/storage.controller.ts', generateStorageController(opts));
  files.set('src/storage/dto/upload-file.dto.ts', generateUploadFileDto());

  return files;
}

// ─── Storage Module ──────────────────────────────────────────

function generateStorageModule(opts: { provider: string; bucket: string; maxFileSize: number }): string {
  return `import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';

@Module({
  providers: [StorageService],
  controllers: [StorageController],
  exports: [StorageService],
})
export class StorageModule {}
`;
}

// ─── Storage Service ─────────────────────────────────────────

function generateStorageService(opts: { provider: string; bucket: string; maxFileSize: number }): string {
  return `import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client;
  private bucket = process.env.S3_BUCKET || '${opts.bucket}';

  constructor() {
    this.s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  async onModuleInit() {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(\`Bucket "\${this.bucket}" exists\`);
    } catch {
      this.logger.log(\`Creating bucket "\${this.bucket}"...\`);
      await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  /**
   * Upload a file to S3/MinIO.
   */
  async upload(key: string, body: Buffer, contentType: string): Promise<{ key: string; url: string }> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    const url = await this.getSignedUrl(key);
    return { key, url };
  }

  /**
   * Get a file from S3/MinIO as a readable stream.
   */
  async getFile(key: string): Promise<{ stream: Readable; contentType?: string }> {
    const result = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    return {
      stream: result.Body as Readable,
      contentType: result.ContentType,
    };
  }

  /**
   * Delete a file from S3/MinIO.
   */
  async delete(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  /**
   * Generate a presigned URL for direct download.
   */
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
  }
}
`;
}

// ─── Storage Controller ──────────────────────────────────────

function generateStorageController(opts: { provider: string; bucket: string; maxFileSize: number }): string {
  const maxBytes = opts.maxFileSize * 1024 * 1024;

  return `import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  Res,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { StorageService } from './storage.service';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@ApiTags('files')
@Controller('files')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: ${maxBytes} })],
      }),
    )
    file: Express.Multer.File,
  ) {
    const ext = path.extname(file.originalname);
    const key = \`\${uuidv4()}\${ext}\`;
    return this.storageService.upload(key, file.buffer, file.mimetype);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Download a file by key' })
  async download(@Param('key') key: string, @Res() res: Response) {
    const { stream, contentType } = await this.storageService.getFile(key);
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    stream.pipe(res);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a file by key' })
  async remove(@Param('key') key: string) {
    await this.storageService.delete(key);
    return { deleted: true, key };
  }
}
`;
}

// ─── DTO ─────────────────────────────────────────────────────

function generateUploadFileDto(): string {
  return `import { ApiProperty } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
`;
}

// ─── Dependencies ────────────────────────────────────────────

export function getFileStorageDependencies(): Record<string, string> {
  return {
    '@aws-sdk/client-s3': '^3.700.0',
    '@aws-sdk/s3-request-presigner': '^3.700.0',
    '@nestjs/platform-express': '^11.0.0',
    'multer': '^1.4.5-lts.1',
    'uuid': '^11.0.0',
  };
}

export function getFileStorageDevDependencies(): Record<string, string> {
  return {
    '@types/multer': '^1.4.0',
    '@types/uuid': '^10.0.0',
  };
}

export function getFileStorageEnvVars(): string {
  return `S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=uploads
`;
}
