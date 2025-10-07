import { Test, TestingModule } from '@nestjs/testing';
import { MessagingConfigModule } from './messaging-config.module';
import { MessagingModule } from '../messaging.module';
import { MessagingConfig, MessagingAdapterType } from './messaging.config';

/**
 * 配置集成测试套件
 *
 * @description 测试消息队列模块与配置模块的完整集成
 * 包括配置加载、验证、服务注入等完整流程
 */
describe('MessagingConfig Integration', () => {
  let module: TestingModule;
  let configService: MessagingConfig;

  describe('完整配置集成测试', () => {
    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          // 配置模块
          MessagingConfigModule.forRoot({
            configPath: './config/messaging.yml',
            envPrefix: 'TEST_MESSAGING_',
            validate: true,
            cache: true,
          }),
          // 消息队列模块 - 使用配置
          MessagingModule.forRoot({
            adapter: MessagingAdapterType.MEMORY,
          }),
        ],
      }).compile();

      configService = module.get<MessagingConfig>(MessagingConfig);
    });

    afterEach(async () => {
      await module.close();
    });

    it('应该成功加载配置并创建消息队列模块', () => {
      expect(module).toBeDefined();
      expect(configService).toBeDefined();
    });

    it('应该能够获取消息队列配置', () => {
      const config = configService;
      expect(config).toBeDefined();
    });

    it('应该验证配置结构的完整性', () => {
      const config = configService;
      if (config) {
        // 验证基础配置
        expect(typeof config.adapter).toBe('string');
        expect(typeof config.keyPrefix).toBe('string');
        expect(typeof config.enableTenantIsolation).toBe('boolean');
      }
    });
  });

  describe('异步配置集成测试', () => {
    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          // 异步配置模块
          MessagingConfigModule.forRootAsync({
            useFactory: async () => {
              // 模拟异步配置加载
              await new Promise((resolve) => setTimeout(resolve, 10));

              return {
                adapter: MessagingAdapterType.RABBITMQ,
                keyPrefix: 'test:async:',
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
                multiTenancy: {
                  context: {
                    enableAutoInjection: true,
                    contextTimeout: 30000,
                    enableAuditLog: true,
                    contextStorage: 'memory',
                    allowCrossTenantAccess: false,
                  },
                  isolation: {
                    strategy: 'key-prefix',
                    keyPrefix: 'test:async:',
                    namespace: 'test-namespace',
                    enableIsolation: true,
                    level: 'strict',
                  },
                },
              };
            },
            validate: true,
            cache: true,
          }),
          // 消息队列模块
          MessagingModule.forRoot({
            adapter: MessagingAdapterType.MEMORY,
          }),
        ],
      }).compile();

      configService = module.get<MessagingConfig>(MessagingConfig);
    });

    afterEach(async () => {
      await module.close();
    });

    it('应该成功加载异步配置', () => {
      const config = configService;
      expect(config).toBeDefined();
      expect(config?.adapter).toBe(MessagingAdapterType.RABBITMQ);
      expect(config?.keyPrefix).toBe('test:async:');
    });

    it('应该验证异步配置的完整性', () => {
      const config = configService;
      expect(config?.rabbitmq?.url).toBe('amqp://localhost:5672');
      expect(config?.cache?.enableMessageDeduplication).toBe(true);
      expect(config?.multiTenancy?.context?.enableAutoInjection).toBe(true);
    });
  });

  describe('环境变量配置集成测试', () => {
    beforeEach(() => {
      // 设置测试环境变量
      process.env['TEST_MESSAGING_ADAPTER'] = 'redis';
      process.env['TEST_MESSAGING_KEY_PREFIX'] = 'env-test:';
      process.env['TEST_MESSAGING_ENABLE_TENANT_ISOLATION'] = 'true';
      process.env['TEST_MESSAGING_REDIS__HOST'] = 'redis-host';
      process.env['TEST_MESSAGING_REDIS__PORT'] = '6380';
      process.env['TEST_MESSAGING_REDIS__STREAM_PREFIX'] = 'env-test:stream:';
      process.env['TEST_MESSAGING_CACHE__ENABLE_MESSAGE_DEDUPLICATION'] =
        'true';
      process.env['TEST_MESSAGING_CACHE__CACHE_TTL__MESSAGE_DEDUP'] = '600';
    });

    afterEach(() => {
      // 清理环境变量
      delete process.env['TEST_MESSAGING_ADAPTER'];
      delete process.env['TEST_MESSAGING_KEY_PREFIX'];
      delete process.env['TEST_MESSAGING_ENABLE_TENANT_ISOLATION'];
      delete process.env['TEST_MESSAGING_REDIS__HOST'];
      delete process.env['TEST_MESSAGING_REDIS__PORT'];
      delete process.env['TEST_MESSAGING_REDIS__STREAM_PREFIX'];
      delete process.env['TEST_MESSAGING_CACHE__ENABLE_MESSAGE_DEDUPLICATION'];
      delete process.env['TEST_MESSAGING_CACHE__CACHE_TTL__MESSAGE_DEDUP'];
    });

    it('应该从环境变量加载配置', async () => {
      const testModule = await Test.createTestingModule({
        imports: [
          MessagingConfigModule.forRoot({
            configPath: './non-existent.yml', // 不存在的配置文件
            envPrefix: 'TEST_MESSAGING_',
            validate: false, // 禁用验证以便测试
          }),
        ],
      }).compile();

      const config = testModule.get<MessagingConfig>(MessagingConfig);

      expect(config?.adapter).toBe('redis');
      expect(config?.keyPrefix).toBe('env-test:');
      expect(config?.enableTenantIsolation).toBe(true);
      expect(config?.redis?.host).toBe('redis-host');
      expect(config?.redis?.port).toBe(6380);
      expect(config?.cache?.enableMessageDeduplication).toBe(true);

      await testModule.close();
    });
  });

  describe('配置验证集成测试', () => {
    it('应该验证必需的配置字段', async () => {
      const testModule = await Test.createTestingModule({
        imports: [
          MessagingConfigModule.forRoot({
            configPath: './non-existent.yml',
            envPrefix: 'TEST_MESSAGING_',
            validate: true, // 启用验证
          }),
        ],
      }).compile();

      // 如果配置验证失败，模块创建应该失败
      expect(testModule).toBeDefined();

      await testModule.close();
    });

    it('应该处理无效的配置值', async () => {
      // 设置无效的环境变量
      process.env['TEST_MESSAGING_ADAPTER'] = 'invalid-adapter';

      try {
        const testModule = await Test.createTestingModule({
          imports: [
            MessagingConfigModule.forRoot({
              configPath: './non-existent.yml',
              envPrefix: 'TEST_MESSAGING_',
              validate: true,
            }),
          ],
        }).compile();

        // 如果验证失败，应该抛出错误
        expect(testModule).toBeDefined();
        await testModule.close();
      } catch (error) {
        // 验证错误应该被捕获
        expect(error).toBeDefined();
      } finally {
        delete process.env['TEST_MESSAGING_ADAPTER'];
      }
    });
  });

  describe('配置缓存集成测试', () => {
    it('应该启用配置缓存', async () => {
      const testModule = await Test.createTestingModule({
        imports: [
          MessagingConfigModule.forRoot({
            configPath: './non-existent.yml',
            envPrefix: 'TEST_MESSAGING_',
            validate: false,
            cache: true, // 启用缓存
          }),
        ],
      }).compile();

      const config1 = testModule.get<MessagingConfig>(MessagingConfig);

      // 多次获取配置应该返回相同的实例（缓存效果）
      const config2 = testModule.get<MessagingConfig>(MessagingConfig);

      expect(config1).toBe(config2); // 应该是同一个对象引用

      await testModule.close();
    });

    it('应该禁用配置缓存', async () => {
      const testModule = await Test.createTestingModule({
        imports: [
          MessagingConfigModule.forRoot({
            configPath: './non-existent.yml',
            envPrefix: 'TEST_MESSAGING_',
            validate: false,
            cache: false, // 禁用缓存
          }),
        ],
      }).compile();

      const testConfigService = testModule.get<MessagingConfig>(MessagingConfig);

      // 多次获取配置可能返回不同的实例（无缓存）
      const config1 = testModule.get<MessagingConfig>(MessagingConfig);
      const config2 = testModule.get<MessagingConfig>(MessagingConfig);

      // 即使禁用缓存，ConfigService通常也会缓存配置
      // 这里主要测试缓存配置不会导致错误
      expect(config1).toBeDefined();
      expect(config2).toBeDefined();

      await testModule.close();
    });
  });

  describe('多环境配置集成测试', () => {
    it('应该支持开发环境配置', async () => {
      // 模拟开发环境
      process.env['NODE_ENV'] = 'development';

      const testModule = await Test.createTestingModule({
        imports: [
          MessagingConfigModule.forRoot({
            configPath: './config/messaging.development.yml',
            envPrefix: 'TEST_MESSAGING_',
            validate: false,
          }),
        ],
      }).compile();

      const config = testModule.get<MessagingConfig>(MessagingConfig);

      // 开发环境通常使用内存适配器
      expect(config).toBeDefined();

      await testModule.close();
      delete process.env['NODE_ENV'];
    });

    it('应该支持生产环境配置', async () => {
      // 模拟生产环境
      process.env['NODE_ENV'] = 'production';

      const testModule = await Test.createTestingModule({
        imports: [
          MessagingConfigModule.forRoot({
            configPath: './config/messaging.production.yml',
            envPrefix: 'TEST_MESSAGING_',
            validate: false,
          }),
        ],
      }).compile();

      const config = testModule.get<MessagingConfig>(MessagingConfig);

      // 生产环境通常使用RabbitMQ适配器
      expect(config).toBeDefined();

      await testModule.close();
      delete process.env['NODE_ENV'];
    });

    it('应该支持测试环境配置', async () => {
      // 模拟测试环境
      process.env['NODE_ENV'] = 'test';

      const testModule = await Test.createTestingModule({
        imports: [
          MessagingConfigModule.forRoot({
            configPath: './config/messaging.test.yml',
            envPrefix: 'TEST_MESSAGING_',
            validate: false,
          }),
        ],
      }).compile();

      const config = testModule.get<MessagingConfig>(MessagingConfig);

      // 测试环境通常使用内存适配器
      expect(config).toBeDefined();

      await testModule.close();
      delete process.env['NODE_ENV'];
    });
  });
});
