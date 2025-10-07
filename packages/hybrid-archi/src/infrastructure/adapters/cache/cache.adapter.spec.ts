/**
 * 缓存适配器单元测试
 *
 * @description 测试缓存适配器的基本功能
 * @since 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '@hl8/cache';
import { PinoLogger } from '@hl8/logger';
import {
  CacheAdapter,
  ICacheConfig,
  CacheLevel,
} from './cache.adapter';

describe('CacheAdapter', () => {
  let adapter: CacheAdapter;
  let mockCacheService: any;
  let mockLogger: jest.Mocked<PinoLogger>;

  beforeEach(async () => {
    const mockCacheServiceInstance = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      clear: jest.fn(),
    };

    const mockLoggerInstance = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: CacheAdapter,
          useFactory: (cacheService: CacheService, logger: PinoLogger) => {
            return new CacheAdapter(cacheService, logger, {
              enableMemoryCache: true,
              enableRedisCache: true,
              enableDistributedCache: false,
              defaultTtl: 300,
              maxMemoryCacheSize: 1000,
              enableCompression: false,
              enableEncryption: false,
              enableStatistics: true,
              keyPrefix: 'hybrid-archi',
              enableWarmup: true,
            });
          },
          inject: [CacheService, PinoLogger],
        },
        {
          provide: CacheService,
          useValue: mockCacheServiceInstance,
        },
        {
          provide: PinoLogger,
          useValue: mockLoggerInstance,
        },
      ],
    }).compile();

    adapter = module.get<CacheAdapter>(CacheAdapter);
    mockCacheService = mockCacheServiceInstance;
    mockLogger = module.get<PinoLogger>(PinoLogger) as jest.Mocked<PinoLogger>;
  });

  describe('get', () => {
    it('应该从内存缓存获取值', async () => {
      const key = 'test-key';
      const value = { data: 'test' };

      // 设置内存缓存
      await adapter.set(key, value, 300, CacheLevel.MEMORY);

      const result = await adapter.get(key, CacheLevel.MEMORY);

      expect(result).toEqual(value);
    });

    it('应该从Redis缓存获取值', async () => {
      const key = 'test-key';
      const value = { data: 'test' };

      mockCacheService.get.mockResolvedValue(value);

      const result = await adapter.get(key, CacheLevel.REDIS);

      expect(mockCacheService.get).toHaveBeenCalledWith(`hybrid-archi:${key}`);
      expect(result).toEqual(value);
    });

    it('应该返回null当缓存不存在时', async () => {
      const key = 'non-existent-key';

      mockCacheService.get.mockResolvedValue(null);

      const result = await adapter.get(key, CacheLevel.REDIS);

      expect(result).toBeNull();
    });

    it('应该处理缓存获取错误', async () => {
      const key = 'test-key';
      const error = new Error('Cache error');

      mockCacheService.get.mockRejectedValue(error);

      await expect(adapter.get(key, CacheLevel.REDIS)).rejects.toThrow(error);
    });
  });

  describe('set', () => {
    it('应该设置内存缓存', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      const ttl = 300;

      await adapter.set(key, value, ttl, CacheLevel.MEMORY);

      const result = await adapter.get(key, CacheLevel.MEMORY);
      expect(result).toEqual(value);
    });

    it('应该设置Redis缓存', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      const ttl = 300;

      mockCacheService.set.mockResolvedValue(undefined);

      await adapter.set(key, value, ttl, CacheLevel.REDIS);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        `hybrid-archi:${key}`,
        value,
        ttl
      );
    });

    it('应该使用默认TTL当未提供时', async () => {
      const key = 'test-key';
      const value = { data: 'test' };

      mockCacheService.set.mockResolvedValue(undefined);

      await adapter.set(key, value, undefined, CacheLevel.REDIS);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        `hybrid-archi:${key}`,
        value,
        300
      );
    });

    it('应该处理缓存设置错误', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      const error = new Error('Cache set error');

      mockCacheService.set.mockRejectedValue(error);

      await expect(
        adapter.set(key, value, 300, CacheLevel.REDIS)
      ).rejects.toThrow(error);
    });
  });

  describe('delete', () => {
    it('应该删除内存缓存', async () => {
      const key = 'test-key';
      const value = { data: 'test' };

      // 先设置缓存
      await adapter.set(key, value, 300, CacheLevel.MEMORY);
      expect(await adapter.get(key, CacheLevel.MEMORY)).toEqual(value);

      // 删除缓存
      await adapter.delete(key, CacheLevel.MEMORY);
      expect(await adapter.get(key, CacheLevel.MEMORY)).toBeNull();
    });

    it('应该删除Redis缓存', async () => {
      const key = 'test-key';

      mockCacheService.delete.mockResolvedValue(undefined);

      await adapter.delete(key, CacheLevel.REDIS);

      expect(mockCacheService.delete).toHaveBeenCalledWith(
        `hybrid-archi:${key}`
      );
    });

    it('应该处理缓存删除错误', async () => {
      const key = 'test-key';
      const error = new Error('Cache delete error');

      mockCacheService.delete.mockRejectedValue(error);

      await expect(adapter.delete(key, CacheLevel.REDIS)).rejects.toThrow(
        error
      );
    });
  });

  describe('exists', () => {
    it('应该检查内存缓存是否存在', async () => {
      const key = 'test-key';
      const value = { data: 'test' };

      // 缓存不存在
      expect(await adapter.exists(key, CacheLevel.MEMORY)).toBe(false);

      // 设置缓存
      await adapter.set(key, value, 300, CacheLevel.MEMORY);
      expect(await adapter.exists(key, CacheLevel.MEMORY)).toBe(true);
    });

    it('应该检查Redis缓存是否存在', async () => {
      const key = 'test-key';

      mockCacheService.exists.mockResolvedValue(true);

      const result = await adapter.exists(key, CacheLevel.REDIS);

      expect(mockCacheService.exists).toHaveBeenCalledWith(
        `hybrid-archi:${key}`
      );
      expect(result).toBe(true);
    });
  });

  describe('mget', () => {
    it('应该批量获取缓存', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const values = { key1: 'value1', key2: 'value2', key3: null };

      // 设置部分缓存
      await adapter.set('key1', 'value1', 300, CacheLevel.MEMORY);
      await adapter.set('key2', 'value2', 300, CacheLevel.MEMORY);

      const result = await adapter.mget(keys, CacheLevel.MEMORY);

      expect(result).toEqual(values);
    });
  });

  describe('mset', () => {
    it('应该批量设置缓存', async () => {
      const data = {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      };
      const ttl = 300;

      await adapter.mset(data, ttl, CacheLevel.MEMORY);

      for (const [key, value] of Object.entries(data)) {
        expect(await adapter.get(key, CacheLevel.MEMORY)).toEqual(value);
      }
    });
  });

  describe('clear', () => {
    it('应该清除内存缓存', async () => {
      const key = 'test-key';
      const value = { data: 'test' };

      // 设置缓存
      await adapter.set(key, value, 300, CacheLevel.MEMORY);
      expect(await adapter.exists(key, CacheLevel.MEMORY)).toBe(true);

      // 清除缓存
      await adapter.clear(CacheLevel.MEMORY);
      expect(await adapter.exists(key, CacheLevel.MEMORY)).toBe(false);
    });

    it('应该清除Redis缓存', async () => {
      mockCacheService.clear.mockResolvedValue(undefined);

      await adapter.clear(CacheLevel.REDIS);

      expect(mockCacheService.clear).toHaveBeenCalled();
    });
  });

  describe('getStatistics', () => {
    it('应该返回缓存统计信息', () => {
      const stats = adapter.getStatistics();

      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('averageResponseTime');
    });
  });

  describe('resetStatistics', () => {
    it('应该重置统计信息', () => {
      adapter.resetStatistics();

      const stats = adapter.getStatistics();
      expect(stats.totalRequests).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.averageResponseTime).toBe(0);
    });
  });

  describe('warmup', () => {
    it('应该预热缓存', async () => {
      const data = {
        key1: 'value1',
        key2: 'value2',
      };
      const ttl = 300;

      await adapter.warmup(data, ttl);

      for (const [key, value] of Object.entries(data)) {
        expect(await adapter.get(key, CacheLevel.MEMORY)).toEqual(value);
      }
    });

    it('应该在禁用预热时跳过', async () => {
      const config: Partial<ICacheConfig> = {
        enableWarmup: false,
      };

      const newAdapter = new CacheAdapter(mockCacheService, mockLogger, config);

      const data = { key1: 'value1' };
      await newAdapter.warmup(data, 300);

      // 验证没有设置缓存
      expect(await newAdapter.get('key1', CacheLevel.MEMORY)).toBeNull();
    });
  });
});
