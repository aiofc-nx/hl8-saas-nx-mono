import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  MessagingConfig,
  RabbitMQConfig,
  RedisConfig,
  KafkaConfig,
  RetryConfig,
  MonitoringConfig,
  MessagingCacheConfig,
  MultiTenancyConfig,
  MessagingAdapterType,
  BackoffStrategy,
} from './messaging.config';

describe('MessagingConfig', () => {
  describe('MessagingConfig validation', () => {
    it('should validate valid config', async () => {
      const configData = {
        adapter: 'rabbitmq',
        keyPrefix: 'test:',
        enableTenantIsolation: true,
        rabbitmq: {
          url: 'amqp://localhost:5672',
          exchange: 'test_exchange',
          queuePrefix: 'test_',
        },
        cache: {
          enableMessageDeduplication: true,
          enableConsumerStateCache: true,
          cacheTTL: {
            messageDedup: 300,
            consumerState: 3600,
          },
        },
      };

      const config = plainToClass(MessagingConfig, configData);
      const errors = await validate(config);

      expect(errors).toHaveLength(0);
      expect(config.adapter).toBe(MessagingAdapterType.RABBITMQ);
      expect(config.keyPrefix).toBe('test:');
    });

    it('should reject invalid adapter', async () => {
      const configData = {
        adapter: 'invalid-adapter',
        keyPrefix: 'test:',
      };

      const config = plainToClass(MessagingConfig, configData);
      const errors = await validate(config);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('adapter');
    });

    it('should require adapter field', async () => {
      const configData = {
        keyPrefix: 'test:',
      };

      const config = plainToClass(MessagingConfig, configData);
      const errors = await validate(config);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('adapter');
    });
  });

  describe('RabbitMQConfig validation', () => {
    it('should validate valid RabbitMQ config', async () => {
      const configData = {
        url: 'amqp://localhost:5672',
        exchange: 'test_exchange',
        queuePrefix: 'test_',
        heartbeat: 30,
      };

      const config = plainToClass(RabbitMQConfig, configData);
      const errors = await validate(config);

      expect(errors).toHaveLength(0);
      expect(config.url).toBe('amqp://localhost:5672');
    });

    it('should require url field', async () => {
      const configData = {
        exchange: 'test_exchange',
        queuePrefix: 'test_',
      };

      const config = plainToClass(RabbitMQConfig, configData);
      const errors = await validate(config);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('url');
    });
  });

  describe('RedisConfig validation', () => {
    it('should validate valid Redis config', async () => {
      const configData = {
        host: 'localhost',
        port: 6379,
        db: 1,
        streamPrefix: 'test:stream:',
        password: 'password',
      };

      const config = plainToClass(RedisConfig, configData);
      const errors = await validate(config);

      expect(errors).toHaveLength(0);
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(6379);
    });

    it('should require required fields', async () => {
      const configData = {
        host: 'localhost',
        // 缺少 port 和 streamPrefix
      };

      const config = plainToClass(RedisConfig, configData);
      const errors = await validate(config);

      expect(errors.length).toBeGreaterThan(0);
      const errorProperties = errors.map((e) => e.property);
      expect(errorProperties).toContain('port');
      expect(errorProperties).toContain('streamPrefix');
    });
  });

  describe('KafkaConfig validation', () => {
    it('should validate valid Kafka config', async () => {
      const configData = {
        clientId: 'test-client',
        brokers: ['localhost:9092'],
        topicPrefix: 'test:',
      };

      const config = plainToClass(KafkaConfig, configData);
      const errors = await validate(config);

      expect(errors).toHaveLength(0);
      expect(config.clientId).toBe('test-client');
      expect(config.brokers).toEqual(['localhost:9092']);
    });

    it('should require required fields', async () => {
      const configData = {
        clientId: 'test-client',
        // 缺少 brokers 和 topicPrefix
      };

      const config = plainToClass(KafkaConfig, configData);
      const errors = await validate(config);

      expect(errors.length).toBeGreaterThan(0);
      const errorProperties = errors.map((e) => e.property);
      expect(errorProperties).toContain('brokers');
      expect(errorProperties).toContain('topicPrefix');
    });
  });

  describe('RetryConfig validation', () => {
    it('should validate valid retry config', async () => {
      const configData = {
        maxRetries: 3,
        retryDelay: 1000,
        backoff: 'exponential',
        enableDeadLetterQueue: true,
      };

      const config = plainToClass(RetryConfig, configData);
      const errors = await validate(config);

      expect(errors).toHaveLength(0);
      expect(config.maxRetries).toBe(3);
      expect(config.backoff).toBe(BackoffStrategy.EXPONENTIAL);
    });

    it('should reject invalid backoff strategy', async () => {
      const configData = {
        maxRetries: 3,
        retryDelay: 1000,
        backoff: 'invalid-strategy',
        enableDeadLetterQueue: true,
      };

      const config = plainToClass(RetryConfig, configData);
      const errors = await validate(config);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('backoff');
    });
  });

  describe('MonitoringConfig validation', () => {
    it('should validate valid monitoring config', async () => {
      const configData = {
        enableStats: true,
        enableHealthCheck: true,
        statsInterval: 60000,
      };

      const config = plainToClass(MonitoringConfig, configData);
      const errors = await validate(config);

      expect(errors).toHaveLength(0);
      expect(config.enableStats).toBe(true);
      expect(config.statsInterval).toBe(60000);
    });

    it('should require required fields', async () => {
      const configData = {
        enableStats: true,
        // 缺少 enableHealthCheck 和 statsInterval
      };

      const config = plainToClass(MonitoringConfig, configData);
      const errors = await validate(config);

      expect(errors.length).toBeGreaterThan(0);
      const errorProperties = errors.map((e) => e.property);
      expect(errorProperties).toContain('enableHealthCheck');
      expect(errorProperties).toContain('statsInterval');
    });
  });

  describe('MessagingCacheConfig validation', () => {
    it('should validate valid cache config', async () => {
      const configData = {
        enableMessageDeduplication: true,
        enableConsumerStateCache: true,
        keyPrefix: 'test:cache:',
        cacheTTL: {
          messageDedup: 300,
          consumerState: 3600,
          stats: 60,
        },
      };

      const config = plainToClass(MessagingCacheConfig, configData);
      const errors = await validate(config);

      expect(errors).toHaveLength(0);
      expect(config.enableMessageDeduplication).toBe(true);
      expect(config.cacheTTL?.messageDedup).toBe(300);
    });

    it('should handle optional fields', async () => {
      const configData = {
        enableMessageDeduplication: true,
        // 其他字段都是可选的
      };

      const config = plainToClass(MessagingCacheConfig, configData);
      const errors = await validate(config);

      expect(errors).toHaveLength(0);
      expect(config.enableMessageDeduplication).toBe(true);
    });
  });

  describe('MultiTenancyConfig validation', () => {
    it('should validate valid multi-tenancy config', async () => {
      const configData = {
        context: {
          enableAutoInjection: true,
          contextTimeout: 30000,
          enableAuditLog: true,
          contextStorage: 'memory',
          allowCrossTenantAccess: false,
        },
        isolation: {
          strategy: 'key-prefix',
          keyPrefix: 'tenant:',
          namespace: 'test-namespace',
          enableIsolation: true,
          level: 'strict',
        },
      };

      const config = plainToClass(MultiTenancyConfig, configData);
      const errors = await validate(config);

      expect(errors).toHaveLength(0);
      expect(config.context?.enableAutoInjection).toBe(true);
      expect(config.isolation?.strategy).toBe('key-prefix');
    });

    it('should handle partial config', async () => {
      const configData = {
        context: {
          enableAutoInjection: true,
          contextTimeout: 30000,
          enableAuditLog: true,
          contextStorage: 'memory',
          allowCrossTenantAccess: false,
        },
        // isolation 是可选的
      };

      const config = plainToClass(MultiTenancyConfig, configData);
      const errors = await validate(config);

      expect(errors).toHaveLength(0);
      expect(config.context?.enableAutoInjection).toBe(true);
      expect(config.isolation).toBeUndefined();
    });
  });
});
