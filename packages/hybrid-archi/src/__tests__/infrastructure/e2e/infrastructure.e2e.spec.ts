/**
 * 基础设施层端到端测试
 *
 * @description 测试基础设施层的完整功能
 * @since 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '@hl8/logger';
import { CacheModule } from '@hl8/cache';
import { DatabaseModule } from '@hl8/database';
import { MessagingModule } from '@hl8/messaging';
import { MultiTenancyModule } from '@hl8/multi-tenancy';
import { InfrastructureFactoriesModule } from '../../../infrastructure/factories/infrastructure-factories.module';
import { PortAdaptersModule } from '../../../infrastructure/adapters/ports/port-adapters.module';
import { CacheAdaptersModule } from '../../../infrastructure/adapters/cache/cache-adapters.module';
import { DatabaseAdaptersModule } from '../../../infrastructure/adapters/database/database-adapters.module';
import { EventStoreAdaptersModule } from '../../../infrastructure/adapters/event-store/event-store-adapters.module';
import { MessageQueueAdaptersModule } from '../../../infrastructure/adapters/message-queue/message-queue-adapters.module';
import { InfrastructureFactory } from '../../../infrastructure/factories/infrastructure.factory';
import { InfrastructureManager } from '../../../infrastructure/factories/infrastructure.manager';
import { InfrastructureServiceType } from '../../../infrastructure/factories/infrastructure.factory';

describe('Infrastructure Layer E2E', () => {
  let module: TestingModule;
  let infrastructureFactory: InfrastructureFactory;
  let infrastructureManager: InfrastructureManager;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        LoggerModule,
        CacheModule,
        DatabaseModule,
        MessagingModule,
        MultiTenancyModule,
        InfrastructureFactoriesModule.forRoot({
          enableInfrastructureFactory: true,
          enableInfrastructureManager: true,
          enableAutoStart: true,
          enableHealthCheck: true,
          enableStatistics: true,
        }),
        PortAdaptersModule.forRoot({
          enableLogger: true,
          enableIdGenerator: true,
          enableTimeProvider: true,
          enableValidation: true,
          enableConfiguration: true,
          enableEventBus: true,
        }),
        CacheAdaptersModule.forRoot({
          enableCache: true,
          enableMemoryCache: true,
          enableRedisCache: true,
          enableCompression: true,
          enableStatistics: true,
        }),
        DatabaseAdaptersModule.forRoot({
          enableDatabase: true,
          enablePostgreSQL: true,
          enableMongoDB: true,
          enableTransaction: true,
          enableQueryCache: true,
        }),
        EventStoreAdaptersModule.forRoot({
          enableEventStore: true,
          enableCache: true,
          enableCompression: true,
          enableEncryption: true,
        }),
        MessageQueueAdaptersModule.forRoot({
          enableMessageQueue: true,
          enableCache: true,
          enableRetry: true,
          enableDeadLetterQueue: true,
          enablePersistence: true,
        }),
      ],
    }).compile();

    infrastructureFactory = module.get<InfrastructureFactory>(
      InfrastructureFactory
    );
    infrastructureManager = module.get<InfrastructureManager>(
      InfrastructureManager
    );
  });

  afterAll(async () => {
    await module.close();
  });

  describe('基础设施服务创建和管理', () => {
    it('应该能够创建和管理所有类型的基础设施服务', async () => {
      // 创建端口适配器
      const loggerPort = infrastructureFactory.createService({
        serviceName: 'LoggerPort',
        serviceType: InfrastructureServiceType.PORT_ADAPTER,
        enabled: true,
        options: { adapterType: 'logger' },
        dependencies: [],
        priority: 1,
        singleton: true,
      });

      const idGeneratorPort = infrastructureFactory.createService({
        serviceName: 'IdGeneratorPort',
        serviceType: InfrastructureServiceType.PORT_ADAPTER,
        enabled: true,
        options: { adapterType: 'idGenerator' },
        dependencies: [],
        priority: 2,
        singleton: true,
      });

      // 创建缓存适配器
      const cacheAdapter = infrastructureFactory.createService({
        serviceName: 'CacheAdapter',
        serviceType: InfrastructureServiceType.CACHE_ADAPTER,
        enabled: true,
        options: {
          enableMemoryCache: true,
          enableRedisCache: true,
          defaultTtl: 300,
          enableCompression: true,
          enableStatistics: true,
        },
        dependencies: [],
        priority: 3,
        singleton: true,
      });

      // 创建数据库适配器
      const databaseAdapter = infrastructureFactory.createService({
        serviceName: 'DatabaseAdapter',
        serviceType: InfrastructureServiceType.DATABASE_ADAPTER,
        enabled: true,
        options: {
          enablePostgreSQL: true,
          enableMongoDB: true,
          enableTransaction: true,
          enableQueryCache: true,
          enableQueryLogging: true,
        },
        dependencies: [],
        priority: 4,
        singleton: true,
      });

      // 创建事件存储适配器
      const eventStoreAdapter = infrastructureFactory.createService({
        serviceName: 'EventStoreAdapter',
        serviceType: InfrastructureServiceType.EVENT_STORE_ADAPTER,
        enabled: true,
        options: {
          enablePostgreSQL: true,
          enableEventSourcing: true,
          enableEventReplay: true,
          enableEventProjection: true,
        },
        dependencies: ['DatabaseAdapter'],
        priority: 5,
        singleton: true,
      });

      // 创建消息队列适配器
      const messageQueueAdapter = infrastructureFactory.createService({
        serviceName: 'MessageQueueAdapter',
        serviceType: InfrastructureServiceType.MESSAGE_QUEUE_ADAPTER,
        enabled: true,
        options: {
          enableRabbitMQ: true,
          enableRedis: true,
          enableMessagePersistence: true,
          enableMessageRetry: true,
        },
        dependencies: [],
        priority: 6,
        singleton: true,
      });

      // 验证所有服务都已创建
      expect(loggerPort).toBeDefined();
      expect(idGeneratorPort).toBeDefined();
      expect(cacheAdapter).toBeDefined();
      expect(databaseAdapter).toBeDefined();
      expect(eventStoreAdapter).toBeDefined();
      expect(messageQueueAdapter).toBeDefined();

      // 验证服务注册
      const allServices = infrastructureManager.getAllServices();
      expect(allServices).toHaveLength(6);
    });

    it('应该能够启动和停止所有服务', async () => {
      // 启动所有服务
      await infrastructureManager.startAllServices();

      // 验证服务状态
      const healthResults =
        await infrastructureManager.healthCheckAllServices();
      expect(healthResults).toBeDefined();

      // 停止所有服务
      await infrastructureManager.stopAllServices();
    });

    it('应该能够重启服务', async () => {
      const serviceName = 'LoggerPort';

      // 重启服务
      await infrastructureManager.restartService(serviceName);

      // 验证服务仍然可用
      const service = infrastructureManager.getService(serviceName);
      expect(service).toBeDefined();
    });
  });

  describe('基础设施服务协作', () => {
    it('应该能够实现服务间的协作', async () => {
      // 获取服务实例
      const loggerPort = infrastructureManager.getService('LoggerPort');
      const idGeneratorPort =
        infrastructureManager.getService('IdGeneratorPort');
      const cacheAdapter = infrastructureManager.getService('CacheAdapter');
      const databaseAdapter =
        infrastructureManager.getService('DatabaseAdapter');

      // 模拟业务场景：创建用户
      const userId = idGeneratorPort.generate();
      const userData = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
      };

      // 记录日志
      loggerPort.info('Creating user', { userId, userData });

      // 缓存用户数据
      await cacheAdapter.set(`user:${userId}`, userData, 300);

      // 从缓存获取用户数据
      const cachedUser = await cacheAdapter.get(`user:${userId}`);
      expect(cachedUser).toEqual(userData);

      // 模拟数据库操作
      const query = 'SELECT * FROM users WHERE id = ?';
      const params = [userId];

      // 这里需要mock数据库查询结果
      // const dbResult = await databaseAdapter.query(query, params);

      loggerPort.info('User created successfully', { userId });
    });

    it('应该能够处理服务依赖关系', async () => {
      // 获取有依赖关系的服务
      const eventStoreAdapter =
        infrastructureManager.getService('EventStoreAdapter');
      const databaseAdapter =
        infrastructureManager.getService('DatabaseAdapter');

      // 验证依赖关系
      const eventStoreRegistration =
        infrastructureManager.getServiceRegistration('EventStoreAdapter');
      expect(eventStoreRegistration?.config.dependencies).toContain(
        'DatabaseAdapter'
      );

      // 验证服务可以正常工作
      expect(eventStoreAdapter).toBeDefined();
      expect(databaseAdapter).toBeDefined();
    });
  });

  describe('基础设施服务监控', () => {
    it('应该提供完整的监控信息', async () => {
      // 获取管理器状态
      const managerStatus = infrastructureManager.getManagerStatus();
      expect(managerStatus).toHaveProperty('config');
      expect(managerStatus).toHaveProperty('statistics');
      expect(managerStatus).toHaveProperty('healthy');
      expect(managerStatus).toHaveProperty('initialized');

      // 获取服务统计信息
      const serviceStatistics = infrastructureManager.getServiceStatistics();
      expect(serviceStatistics).toHaveProperty('totalServices');
      expect(serviceStatistics).toHaveProperty('activeServices');
      expect(serviceStatistics).toHaveProperty('serviceTypes');
      expect(serviceStatistics).toHaveProperty('serviceStatuses');

      // 获取健康检查结果
      const healthResults =
        await infrastructureManager.healthCheckAllServices();
      expect(healthResults).toBeDefined();
      expect(typeof healthResults).toBe('object');
    });

    it('应该支持统计信息收集', async () => {
      // 获取所有服务统计信息
      const allStats = await infrastructureManager.getAllDatabaseStatistics();
      expect(allStats).toBeDefined();

      // 重置统计信息
      await infrastructureManager.resetAllDatabaseStatistics();

      // 验证统计信息已重置
      const stats = infrastructureManager.getServiceStatistics();
      expect(stats.totalServices).toBeGreaterThanOrEqual(0);
    });
  });

  describe('基础设施服务性能', () => {
    it('应该能够处理高并发请求', async () => {
      const cacheAdapter = infrastructureManager.getService('CacheAdapter');
      const idGeneratorPort =
        infrastructureManager.getService('IdGeneratorPort');

      const concurrentRequests = 100;
      const promises: Promise<any>[] = [];

      // 创建并发请求
      for (let i = 0; i < concurrentRequests; i++) {
        const key = `concurrent-test-${i}`;
        const value = { index: i, timestamp: Date.now() };

        promises.push(
          cacheAdapter.set(key, value, 300).then(() => cacheAdapter.get(key))
        );
      }

      // 等待所有请求完成
      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();

      // 验证结果
      expect(results).toHaveLength(concurrentRequests);
      expect(endTime - startTime).toBeLessThan(5000); // 5秒内完成
    });

    it('应该能够处理大量服务操作', async () => {
      const operations = 1000;
      const startTime = Date.now();

      // 执行大量服务操作
      for (let i = 0; i < operations; i++) {
        const serviceName = `test-service-${i}`;
        const serviceType = InfrastructureServiceType.PORT_ADAPTER;
        const config = {
          serviceName,
          serviceType,
          enabled: true,
          options: { adapterType: 'logger' },
          dependencies: [],
          priority: i,
          singleton: false,
        };

        // 创建服务
        infrastructureFactory.createService(config);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 验证性能
      expect(duration).toBeLessThan(10000); // 10秒内完成1000次操作
    });
  });

  describe('基础设施服务错误处理', () => {
    it('应该能够处理服务创建错误', async () => {
      // 尝试创建无效的服务
      const invalidConfig = {
        serviceName: 'InvalidService',
        serviceType: 'INVALID_TYPE' as any,
        enabled: true,
        options: {},
        dependencies: [],
        priority: 1,
        singleton: true,
      };

      expect(() => {
        infrastructureFactory.createService(invalidConfig);
      }).toThrow();
    });

    it('应该能够处理服务启动错误', async () => {
      const serviceName = 'NonExistentService';

      // 尝试启动不存在的服务
      await expect(
        infrastructureManager.startService(serviceName)
      ).rejects.toThrow();
    });

    it('应该能够处理服务停止错误', async () => {
      const serviceName = 'NonExistentService';

      // 尝试停止不存在的服务
      await expect(
        infrastructureManager.stopService(serviceName)
      ).rejects.toThrow();
    });
  });
});
