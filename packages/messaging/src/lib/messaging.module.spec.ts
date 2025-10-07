import { Test, TestingModule } from '@nestjs/testing';
import { MessagingModule } from './messaging.module';
import { MessagingService } from './messaging.service';
import { EventService } from './event.service';
import { TaskService } from './task.service';
import { MessagingMonitor } from './monitoring/messaging-monitor.service';
import { MessagingStatsService } from './monitoring/messaging-stats.service';
import { HealthCheckService } from './monitoring/health-check.service';
import {
  MessagingModuleOptions,
  MessagingAdapterType,
} from './types/messaging.types';

describe('MessagingModule', () => {
  describe('forRoot', () => {
    it('should create module with default options', () => {
      const options: MessagingModuleOptions = {
        adapter: MessagingAdapterType.MEMORY,
      };

      const module = MessagingModule.forRoot(options);

      expect(module).toBeDefined();
      expect(module.module).toBe(MessagingModule);
      expect(module.imports).toBeDefined();
      expect(module.providers).toBeDefined();
      expect(module.exports).toBeDefined();
    });

    it('should create module with RabbitMQ adapter', () => {
      const options: MessagingModuleOptions = {
        adapter: MessagingAdapterType.RABBITMQ,
        rabbitmq: {
          url: 'amqp://localhost:5672',
          exchange: 'test-exchange',
          queuePrefix: 'test_',
        },
      };

      const module = MessagingModule.forRoot(options);

      expect(module).toBeDefined();
      expect(module.providers).toContainEqual(
        expect.objectContaining({
          provide: 'MESSAGING_ADAPTER',
        })
      );
    });

    it('should create module with Redis adapter', () => {
      const options: MessagingModuleOptions = {
        adapter: MessagingAdapterType.REDIS,
        redis: {
          host: 'localhost',
          port: 6379,
          streamPrefix: 'test_stream_',
        },
      };

      const module = MessagingModule.forRoot(options);

      expect(module).toBeDefined();
      expect(module.providers).toContainEqual(
        expect.objectContaining({
          provide: 'MESSAGING_ADAPTER',
        })
      );
    });

    it('should create module with Kafka adapter', () => {
      const options: MessagingModuleOptions = {
        adapter: MessagingAdapterType.KAFKA,
        kafka: {
          clientId: 'test-client',
          brokers: ['localhost:9092'],
          topicPrefix: 'test_topic_',
        },
      };

      const module = MessagingModule.forRoot(options);

      expect(module).toBeDefined();
      expect(module.providers).toContainEqual(
        expect.objectContaining({
          provide: 'MESSAGING_ADAPTER',
        })
      );
    });

    it('should include all required services', () => {
      const options: MessagingModuleOptions = {
        adapter: MessagingAdapterType.MEMORY,
      };

      const module = MessagingModule.forRoot(options);

      const providerTokens =
        module.providers?.map((p) =>
          typeof p === 'object' && 'provide' in p ? p.provide : p
        ) || [];

      expect(providerTokens).toContain(MessagingService);
      expect(providerTokens).toContain(EventService);
      expect(providerTokens).toContain(TaskService);
      expect(providerTokens).toContain(MessagingMonitor);
      expect(providerTokens).toContain(MessagingStatsService);
      expect(providerTokens).toContain(HealthCheckService);
    });

    it('should include memory adapter as fallback', () => {
      const options: MessagingModuleOptions = {
        adapter: MessagingAdapterType.MEMORY,
      };

      const module = MessagingModule.forRoot(options);

      const providerTokens =
        module.providers?.map((p) =>
          typeof p === 'object' && 'provide' in p ? p.provide : p
        ) || [];

      expect(providerTokens).toContain('MEMORY_ADAPTER');
    });

    it('should export all required services', () => {
      const options: MessagingModuleOptions = {
        adapter: MessagingAdapterType.MEMORY,
      };

      const module = MessagingModule.forRoot(options);

      expect(module.exports).toContain(MessagingService);
      expect(module.exports).toContain(EventService);
      expect(module.exports).toContain(TaskService);
      expect(module.exports).toContain(MessagingMonitor);
      expect(module.exports).toContain(MessagingStatsService);
      expect(module.exports).toContain(HealthCheckService);
    });
  });

  describe('forRootAsync', () => {
    it('should create async module', () => {
      const options = {
        useFactory: () => ({
          adapter: MessagingAdapterType.MEMORY,
        }),
      };

      const module = MessagingModule.forRootAsync(options);

      expect(module).toBeDefined();
      expect(module.module).toBe(MessagingModule);
      expect(module.imports).toBeDefined();
      expect(module.providers).toBeDefined();
      expect(module.exports).toBeDefined();
    });

    it('should create async module with dependencies', () => {
      const options = {
        useFactory: (...args: unknown[]) => ({
          adapter: MessagingAdapterType.RABBITMQ,
          rabbitmq: {
            url: 'amqp://localhost:5672',
            exchange: 'test-exchange',
            queuePrefix: 'test_',
          },
        }),
        inject: ['ConfigService'],
      };

      const module = MessagingModule.forRootAsync(options);

      expect(module).toBeDefined();
      expect(module.providers).toContainEqual(
        expect.objectContaining({
          provide: 'MESSAGING_MODULE_OPTIONS',
          useFactory: options.useFactory,
          inject: ['ConfigService'],
        })
      );
    });

    it('should handle async factory with Promise', () => {
      const options = {
        useFactory: async () => ({
          adapter: MessagingAdapterType.MEMORY,
        }),
      };

      const module = MessagingModule.forRootAsync(options);

      expect(module).toBeDefined();
    });
  });

  describe('integration test', () => {
    let module: TestingModule;

    afterEach(async () => {
      if (module) {
        await module.close();
      }
    });

    it('should create and initialize module', async () => {
      const options: MessagingModuleOptions = {
        adapter: MessagingAdapterType.MEMORY,
      };

      module = await Test.createTestingModule({
        imports: [MessagingModule.forRoot(options)],
      }).compile();

      const messagingService = module.get<MessagingService>(MessagingService);
      const eventService = module.get<EventService>(EventService);
      const taskService = module.get<TaskService>(TaskService);

      expect(messagingService).toBeDefined();
      expect(eventService).toBeDefined();
      expect(taskService).toBeDefined();
    });

    it('should handle async module initialization', async () => {
      const options = {
        useFactory: async () => ({
          adapter: MessagingAdapterType.MEMORY,
        }),
      };

      module = await Test.createTestingModule({
        imports: [MessagingModule.forRootAsync(options)],
      }).compile();

      const messagingService = module.get<MessagingService>(MessagingService);

      expect(messagingService).toBeDefined();
    });
  });
});
