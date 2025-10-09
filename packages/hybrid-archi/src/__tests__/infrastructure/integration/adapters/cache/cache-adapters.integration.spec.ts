/**
 * 缓存适配器集成测试
 *
 * @description 测试缓存适配器的集成功能
 * @since 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CacheModule } from '@hl8/cache';
import { LoggerModule } from '@hl8/logger';
import { CacheAdaptersModule } from '../../../../../infrastructure/adapters/cache/cache-adapters.module';
import { CacheAdapter } from '../../../../../infrastructure/adapters/cache/cache.adapter';
import { CacheFactory } from '../../../../../infrastructure/adapters/cache/cache.factory';
import { CacheManager } from '../../../../../infrastructure/adapters/cache/cache.manager';
import { CacheLevel } from '../../../../../infrastructure/adapters/cache/cache.adapter';

describe('CacheAdaptersModule Integration', () => {
  let module: TestingModule;
  let cacheAdapter: CacheAdapter;
  let cacheFactory: CacheFactory;
  let cacheManager: CacheManager;

  beforeEach(async () => {
    try {
      module = await Test.createTestingModule({
        imports: [
          CacheModule.forRoot({
            redis: {
              host: 'localhost',
              port: 6379,
            },
            defaultTTL: 3600,
            keyPrefix: 'test:',
          }),
          LoggerModule.forRoot({
            config: {
              level: 'error',
            },
          }),
          CacheAdaptersModule.forRoot({
            enableCache: true,
            enableMemoryCache: true,
            enableRedisCache: true,
            enableCompression: true,
            enableStatistics: true,
          }),
        ],
      }).compile();

      cacheAdapter = module.get<CacheAdapter>('ICache');
      cacheFactory = module.get<CacheFactory>(CacheFactory);
      cacheManager = module.get<CacheManager>(CacheManager);
    } catch (error) {
      console.error('Failed to initialize test module:', error);
      throw error;
    }
  });

  afterEach(async () => {
    if (module) {
      try {
        await module.close();
      } catch (error) {
        console.error('Failed to close test module:', error);
      }
    }
  });

  describe('CacheAdapter', () => {
    it('应该正确注入和初始化', () => {
      expect(cacheAdapter).toBeDefined();
      expect(cacheAdapter).toBeInstanceOf(CacheAdapter);
    });

    it('应该能够设置和获取缓存', async () => {
      const key = 'test-key';
      const value = { data: 'test value' };
      const ttl = 300;

      // 设置缓存
      await cacheAdapter.set(key, value, ttl);

      // 获取缓存
      const result = await cacheAdapter.get(key);

      expect(result).toEqual(value);
    });

    it('应该支持多级缓存策略', async () => {
      const key = 'multi-level-key';
      const value = { data: 'multi-level value' };
      const ttl = 300;

      // 测试内存缓存
      await cacheAdapter.set(key, value, ttl, CacheLevel.MEMORY);
      const memoryResult = await cacheAdapter.get(key, CacheLevel.MEMORY);
      expect(memoryResult).toEqual(value);

      // 测试Redis缓存
      await cacheAdapter.set(key, value, ttl, CacheLevel.REDIS);
      const redisResult = await cacheAdapter.get(key, CacheLevel.REDIS);
      expect(redisResult).toEqual(value);
    });

    it('应该支持批量操作', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const data = {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      };
      const ttl = 300;

      // 批量设置
      await cacheAdapter.mset(data, ttl);

      // 批量获取
      const results = await cacheAdapter.mget(keys);

      expect(results).toEqual(data);
    });

    it('应该支持缓存预热', async () => {
      const warmupData = {
        'warmup-key1': 'warmup-value1',
        'warmup-key2': 'warmup-value2',
      };
      const ttl = 300;

      await cacheAdapter.warmup(warmupData, ttl);

      for (const [key, value] of Object.entries(warmupData)) {
        const result = await cacheAdapter.get(key);
        expect(result).toEqual(value);
      }
    });

    it('应该提供统计信息', () => {
      const stats = cacheAdapter.getStatistics();

      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('averageResponseTime');
    });

    it('应该支持统计信息重置', () => {
      cacheAdapter.resetStatistics();

      const stats = cacheAdapter.getStatistics();
      expect(stats.totalRequests).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('CacheFactory', () => {
    it('应该正确注入和初始化', () => {
      expect(cacheFactory).toBeDefined();
      expect(cacheFactory).toBeInstanceOf(CacheFactory);
    });

    it('应该能够创建缓存实例', () => {
      const cacheName = 'test-cache';
      const cacheType = 'test';
      const config = {
        enableMemoryCache: true,
        enableRedisCache: true,
        defaultTtl: 300,
      };

      const cache = cacheFactory.createCache(cacheName, cacheType, config);

      expect(cache).toBeDefined();
      expect(cache).toBeInstanceOf(CacheAdapter);
    });

    it('应该能够获取已创建的缓存', () => {
      const cacheName = 'test-cache';
      const cacheType = 'test';
      const config = {};

      // 创建缓存
      cacheFactory.createCache(cacheName, cacheType, config);

      // 获取缓存
      const cache = cacheFactory.getCache(cacheName);

      expect(cache).toBeDefined();
      expect(cache).toBeInstanceOf(CacheAdapter);
    });

    it('应该能够获取或创建缓存', () => {
      const cacheName = 'get-or-create-cache';
      const cacheType = 'test';
      const config = {};

      // 第一次调用应该创建缓存
      const cache1 = cacheFactory.getOrCreateCache(
        cacheName,
        cacheType,
        config
      );
      expect(cache1).toBeDefined();

      // 第二次调用应该返回已存在的缓存
      const cache2 = cacheFactory.getOrCreateCache(
        cacheName,
        cacheType,
        config
      );
      expect(cache2).toBe(cache1);
    });
  });

  describe('CacheManager', () => {
    it('应该正确注入和初始化', () => {
      expect(cacheManager).toBeDefined();
      expect(cacheManager).toBeInstanceOf(CacheManager);
    });

    it('应该能够管理缓存生命周期', async () => {
      const cacheName = 'managed-cache';
      const cacheType = 'test';
      const config = {
        enableMemoryCache: true,
        enableRedisCache: true,
        defaultTtl: 300,
      };

      // 创建缓存
      const cache = cacheManager.createCache(cacheName, cacheType, config);
      expect(cache).toBeDefined();

      // 获取缓存
      const retrievedCache = cacheManager.getCache(cacheName);
      expect(retrievedCache).toBe(cache);

      // 获取所有缓存
      const allCaches = cacheManager.getAllCaches();
      expect(allCaches).toHaveLength(1);
      expect(allCaches[0].cacheName).toBe(cacheName);
    });

    it('应该提供缓存统计信息', () => {
      const stats = cacheManager.getCacheStatistics();

      expect(stats).toHaveProperty('totalCaches');
      expect(stats).toHaveProperty('activeCaches');
      expect(stats).toHaveProperty('cacheTypes');
      expect(stats).toHaveProperty('averageAge');
    });

    it('应该支持健康检查', async () => {
      const healthResults = await cacheManager.healthCheckAllCaches();

      expect(healthResults).toBeDefined();
      expect(typeof healthResults).toBe('object');
    });
  });

  describe('缓存性能测试', () => {
    it('应该能够处理大量缓存操作', async () => {
      const startTime = Date.now();
      const operations = 1000;

      // 执行大量缓存操作
      for (let i = 0; i < operations; i++) {
        const key = `perf-test-${i}`;
        const value = { index: i, data: `test-data-${i}` };

        await cacheAdapter.set(key, value, 300);
        await cacheAdapter.get(key);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 验证性能（这里只是示例，实际阈值需要根据环境调整）
      expect(duration).toBeLessThan(5000); // 5秒内完成1000次操作
    });

    it('应该支持并发缓存操作', async () => {
      const concurrentOperations = 100;
      const promises: Promise<any>[] = [];

      // 创建并发操作
      for (let i = 0; i < concurrentOperations; i++) {
        const key = `concurrent-test-${i}`;
        const value = { index: i, data: `concurrent-data-${i}` };

        promises.push(
          cacheAdapter.set(key, value, 300).then(() => cacheAdapter.get(key))
        );
      }

      // 等待所有操作完成
      const results = await Promise.all(promises);

      expect(results).toHaveLength(concurrentOperations);
      results.forEach((result, index) => {
        expect(result).toEqual({ index, data: `concurrent-data-${index}` });
      });
    });
  });
});
