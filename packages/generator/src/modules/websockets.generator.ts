import type { GyxerProject } from '@gyxer-studio/schema';

/**
 * Get websockets module options from project config.
 */
function getWsOptions(project: GyxerProject): {
  namespace: string;
  cors: boolean;
} {
  const mod = project.modules?.find(
    (m) => m.name === 'websockets' && m.enabled !== false,
  );
  return {
    namespace: (mod?.options?.namespace as string) || '/',
    cors: (mod?.options?.cors as boolean) ?? true,
  };
}

/**
 * Generate all files needed for the WebSockets module.
 */
export function generateWebsocketsFiles(project: GyxerProject): Map<string, string> {
  const files = new Map<string, string>();
  const opts = getWsOptions(project);

  files.set('src/websockets/websockets.module.ts', generateWsModule());
  files.set('src/websockets/websockets.gateway.ts', generateWsGateway(opts));
  files.set('src/websockets/dto/ws-message.dto.ts', generateWsMessageDto());

  return files;
}

// ─── WebSockets Module ──────────────────────────────────────

function generateWsModule(): string {
  return `import { Module } from '@nestjs/common';
import { AppGateway } from './websockets.gateway';

@Module({
  providers: [AppGateway],
  exports: [AppGateway],
})
export class WebsocketsModule {}
`;
}

// ─── WebSocket Gateway ──────────────────────────────────────

function generateWsGateway(opts: { namespace: string; cors: boolean }): string {
  const corsOpt = opts.cors ? `\n    cors: { origin: '*' },` : '';

  return `import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsMessageDto } from './dto/ws-message.dto';

@WebSocketGateway({
  namespace: '${opts.namespace}',${corsOpt}
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppGateway.name);

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(\`Client connected: \${client.id}\`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(\`Client disconnected: \${client.id}\`);
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: WsMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(\`Message from \${client.id}: \${JSON.stringify(data)}\`);

    // Broadcast to all clients
    this.server.emit('message', {
      sender: client.id,
      ...data,
      timestamp: new Date().toISOString(),
    });

    return { event: 'message', data: { status: 'received' } };
  }

  /**
   * Broadcast a message to all connected clients.
   */
  broadcast(event: string, data: unknown) {
    this.server.emit(event, data);
  }
}
`;
}

// ─── DTO ────────────────────────────────────────────────────

function generateWsMessageDto(): string {
  return `import { IsString, IsOptional } from 'class-validator';

export class WsMessageDto {
  @IsString()
  event: string;

  @IsOptional()
  data?: unknown;
}
`;
}

// ─── Dependencies ───────────────────────────────────────────

export function getWebsocketsDependencies(): Record<string, string> {
  return {
    '@nestjs/websockets': '^11.0.0',
    '@nestjs/platform-socket.io': '^11.0.0',
    'socket.io': '^4.8.0',
  };
}

export function getWebsocketsEnvVars(): string {
  return '';
}
