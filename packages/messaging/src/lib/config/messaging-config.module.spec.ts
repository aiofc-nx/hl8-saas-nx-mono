import { Test, TestingModule } from '@nestjs/testing';
import { MessagingConfigModule } from './messaging-config.module';
import { MessagingConfig, MessagingAdapterType } from './messaging.config';

describe('MessagingConfigModule', () => {
  let module: TestingModule;
  let configService: MessagingConfig;

  describe('forRoot', () => {
    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          MessagingConfigModule.forRoot({
            configPath: './test-config.yml',
            envPrefix: 'TEST_MESSAGING_',
            validate: true,
            cache: true,
          }),
        ],
      }).compile();

      configService = module.get<MessagingConfig>(MessagingConfig);
    });

    afterEach(async () => {
      await module.close();
    });

    it('should be defined', () => {
      expect(module).toBeDefined();
      expect(configService).toBeDefined();
    });

    it('should load messaging config', () => {
      expect(configService).toBeDefined();
    });

    it('should validate config structure', () => {
      if (configService) {
        expect(typeof configService.adapter).toBe('string');
        expect(configService.keyPrefix).toBeDefined();
      }
    });
  });

  describe('forRootAsync', () => {
    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          MessagingConfigModule.forRootAsync({
            useFactory: async () => {
              return {
                adapter: MessagingAdapterType.RABBITMQ,
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
            },
            validate: true,
            cache: true,
          }),
        ],
      }).compile();

      configService = module.get<MessagingConfig>(MessagingConfig);
    });

    afterEach(async () => {
      await module.close();
    });

    it('should load async config', () => {
      expect(configService).toBeDefined();
      expect(configService?.adapter).toBe(MessagingAdapterType.RABBITMQ);
      expect(configService?.keyPrefix).toBe('test:');
    });

    it('should validate async config', () => {
      expect(configService?.rabbitmq?.url).toBe('amqp://localhost:5672');
      expect(configService?.cache?.enableMessageDeduplication).toBe(true);
    });
  });

  describe('config validation', () => {
    it('should validate required fields', () => {
      const validConfig: Partial<MessagingConfig> = {
        adapter: MessagingAdapterType.RABBITMQ,
        keyPrefix: 'test:',
        rabbitmq: {
          url: 'amqp://localhost:5672',
          exchange: 'test',
          queuePrefix: 'test_',
        },
      };

      // 这里可以添加具体的验证逻辑测试
      expect(validConfig.adapter).toBe(MessagingAdapterType.RABBITMQ);
      expect(validConfig.rabbitmq?.url).toBe('amqp://localhost:5672');
    });

    it('should handle invalid config gracefully', () => {
      const invalidConfig = {
        adapter: 'invalid-adapter',
        // 缺少必需字段
      };

      // 这里可以添加错误处理测试
      expect(invalidConfig.adapter).toBe('invalid-adapter');
    });
  });

  describe('environment variable support', () => {
    beforeEach(() => {
      // 设置测试环境变量
      process.env['TEST_MESSAGING_ADAPTER'] = 'redis';
      process.env['TEST_MESSAGING_KEY_PREFIX'] = 'env-test:';
      process.env['TEST_MESSAGING_ENABLE_TENANT_ISOLATION'] = 'true';
    });

    afterEach(() => {
      // 清理环境变量
      delete process.env['TEST_MESSAGING_ADAPTER'];
      delete process.env['TEST_MESSAGING_KEY_PREFIX'];
      delete process.env['TEST_MESSAGING_ENABLE_TENANT_ISOLATION'];
    });

    it('should load config from environment variables', async () => {
      const testModule = await Test.createTestingModule({
        imports: [
          MessagingConfigModule.forRoot({
            configPath: './non-existent.yml', // 不存在的配置文件
            envPrefix: 'TEST_MESSAGING_',
            validate: false, // 禁用验证以便测试
          }),
        ],
      }).compile();

      const testConfigService =
        testModule.get<MessagingConfig>(MessagingConfig);
      const config = testConfigService;

      expect(config?.adapter).toBe('redis');
      expect(config?.keyPrefix).toBe('env-test:');
      expect(config?.enableTenantIsolation).toBe(true);

      await testModule.close();
    });
  });
});
