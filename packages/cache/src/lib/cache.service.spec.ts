/**
 * 缓存服务测试
 *
 * @description 测试缓存服务的核心功能
 *
 * @since 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { RedisService } from './redis.service';
import { ContextService } from './context.service';
import { PinoLogger } from '@hl8/logger';

describe('CacheService', () => {
  let service: CacheService;
  let redisService: jest.Mocked<RedisService>;
  let contextService: jest.Mocked<ContextService>;
  let logger: jest.Mocked<PinoLogger>;

  beforeEach(async () => {
    const mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      mget: jest.fn(),
      mset: jest.fn(),
      mdelete: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
      keys: jest.fn(),
      flush: jest.fn(),
      isHealthy: jest.fn(),
      getConnectionInfo: jest.fn(),
    };

    const mockContextService = {
      getTenant: jest.fn(),
      hasTenantContext: jest.fn(),
      setTenant: jest.fn(),
      getUser: jest.fn(),
      setUser: jest.fn(),
      setRequestId: jest.fn(),
      getRequestId: jest.fn(),
      setContext: jest.fn(),
      getContext: jest.fn(),
      deleteContext: jest.fn(),
      hasContext: jest.fn(),
      getAllContext: jest.fn(),
      clear: jest.fn(),
      runWithContext: jest.fn(),
      runWithTenant: jest.fn(),
      runWithUser: jest.fn(),
      hasUserContext: jest.fn(),
      hasRequestContext: jest.fn(),
      getContextSummary: jest.fn(),
      validateContext: jest.fn(),
    };

    const mockLogger = {
      setContext: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: ContextService,
          useValue: mockContextService,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
        {
          provide: 'CACHE_MODULE_OPTIONS',
          useValue: {
            redis: {
              host: 'localhost',
              port: 6379,
            },
            defaultTTL: 3600,
            keyPrefix: 'test:',
            enableTenantIsolation: true,
          },
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    redisService = module.get(RedisService);
    contextService = module.get(ContextService);
    logger = module.get(PinoLogger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return cached value when key exists', async () => {
      const testKey = 'test-key';
      const testValue = { data: 'test' };

      contextService.getTenant.mockReturnValue('tenant-1');
      redisService.get.mockResolvedValue(testValue);

      const result = await service.get(testKey);

      expect(result).toEqual(testValue);
      expect(redisService.get).toHaveBeenCalledWith(
        'test:tenant:tenant-1:test-key'
      );
    });

    it('should return null when key does not exist', async () => {
      const testKey = 'non-existent-key';

      contextService.getTenant.mockReturnValue('tenant-1');
      redisService.get.mockResolvedValue(null);

      const result = await service.get(testKey);

      expect(result).toBeNull();
    });

    it('should handle tenant isolation correctly', async () => {
      const testKey = 'test-key';
      const testValue = { data: 'test' };

      contextService.getTenant.mockReturnValue('tenant-2');
      redisService.get.mockResolvedValue(testValue);

      await service.get(testKey);

      expect(redisService.get).toHaveBeenCalledWith(
        'test:tenant:tenant-2:test-key'
      );
    });
  });

  describe('set', () => {
    it('should set cache value with tenant isolation', async () => {
      const testKey = 'test-key';
      const testValue = { data: 'test' };
      const ttl = 1800;

      contextService.getTenant.mockReturnValue('tenant-1');
      redisService.set.mockResolvedValue(undefined);

      await service.set(testKey, testValue, ttl);

      expect(redisService.set).toHaveBeenCalledWith(
        'test:tenant:tenant-1:test-key',
        testValue,
        ttl
      );
    });

    it('should use default TTL when not provided', async () => {
      const testKey = 'test-key';
      const testValue = { data: 'test' };

      contextService.getTenant.mockReturnValue('tenant-1');
      redisService.set.mockResolvedValue(undefined);

      await service.set(testKey, testValue);

      expect(redisService.set).toHaveBeenCalledWith(
        'test:tenant:tenant-1:test-key',
        testValue,
        3600
      );
    });
  });

  describe('delete', () => {
    it('should delete cache value with tenant isolation', async () => {
      const testKey = 'test-key';

      contextService.getTenant.mockReturnValue('tenant-1');
      redisService.delete.mockResolvedValue(undefined);

      await service.delete(testKey);

      expect(redisService.delete).toHaveBeenCalledWith(
        'test:tenant:tenant-1:test-key'
      );
    });
  });

  describe('exists', () => {
    it('should check if key exists with tenant isolation', async () => {
      const testKey = 'test-key';

      contextService.getTenant.mockReturnValue('tenant-1');
      redisService.exists.mockResolvedValue(true);

      const result = await service.exists(testKey);

      expect(result).toBe(true);
      expect(redisService.exists).toHaveBeenCalledWith(
        'test:tenant:tenant-1:test-key'
      );
    });
  });

  describe('mget', () => {
    it('should get multiple values with tenant isolation', async () => {
      const testKeys = ['key1', 'key2'];
      const testValues = [{ data: 'test1' }, { data: 'test2' }];

      contextService.getTenant.mockReturnValue('tenant-1');
      redisService.mget.mockResolvedValue(testValues);

      const result = await service.mget(testKeys);

      expect(result).toEqual(testValues);
      expect(redisService.mget).toHaveBeenCalledWith([
        'test:tenant:tenant-1:key1',
        'test:tenant:tenant-1:key2',
      ]);
    });
  });

  describe('mset', () => {
    it('should set multiple values with tenant isolation', async () => {
      const testPairs = [
        { key: 'key1', value: { data: 'test1' }, ttl: 1800 },
        { key: 'key2', value: { data: 'test2' } },
      ];

      contextService.getTenant.mockReturnValue('tenant-1');
      redisService.mset.mockResolvedValue(undefined);

      await service.mset(testPairs);

      expect(redisService.mset).toHaveBeenCalledWith([
        {
          key: 'test:tenant:tenant-1:key1',
          value: { data: 'test1' },
          ttl: 1800,
        },
        {
          key: 'test:tenant:tenant-1:key2',
          value: { data: 'test2' },
          ttl: 3600,
        },
      ]);
    });
  });

  describe('mdelete', () => {
    it('should delete multiple values with tenant isolation', async () => {
      const testKeys = ['key1', 'key2'];

      contextService.getTenant.mockReturnValue('tenant-1');
      redisService.mdelete.mockResolvedValue(undefined);

      await service.mdelete(testKeys);

      expect(redisService.mdelete).toHaveBeenCalledWith([
        'test:tenant:tenant-1:key1',
        'test:tenant:tenant-1:key2',
      ]);
    });
  });

  describe('getCurrentTenant', () => {
    it('should return current tenant from context', () => {
      const testTenant = 'tenant-1';
      contextService.getTenant.mockReturnValue(testTenant);

      const result = service.getCurrentTenant();

      expect(result).toBe(testTenant);
      expect(contextService.getTenant).toHaveBeenCalled();
    });
  });

  describe('hasTenantContext', () => {
    it('should check if tenant context exists', () => {
      contextService.hasTenantContext.mockReturnValue(true);

      const result = service.hasTenantContext();

      expect(result).toBe(true);
      expect(contextService.hasTenantContext).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      const stats = service.getStats();

      expect(stats).toBeDefined();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.totalKeys).toBe(0);
      expect(stats.memoryUsage).toBe(0);
      expect(stats.tenantStats).toBeInstanceOf(Map);
    });
  });

  describe('clearTenantCache', () => {
    it('should clear cache for specific tenant', async () => {
      const tenantId = 'tenant-1';
      const mockKeys = ['key1', 'key2'];

      redisService.keys.mockResolvedValue(mockKeys);
      redisService.mdelete.mockResolvedValue(undefined);

      await service.clearTenantCache(tenantId);

      expect(redisService.keys).toHaveBeenCalledWith('test:tenant:tenant-1:*');
      expect(redisService.mdelete).toHaveBeenCalledWith(mockKeys);
    });
  });

  describe('getHealthStatus', () => {
    it('should return health status', async () => {
      redisService.isHealthy.mockReturnValue(true);
      contextService.hasTenantContext.mockReturnValue(true);

      const healthStatus = await service.getHealthStatus();

      expect(healthStatus).toBeDefined();
      expect(healthStatus.isHealthy).toBe(true);
      expect(healthStatus.redisConnected).toBe(true);
      expect(healthStatus.contextAvailable).toBe(true);
      expect(healthStatus.stats).toBeDefined();
    });
  });
});
