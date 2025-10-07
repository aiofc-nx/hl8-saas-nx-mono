/**
 * 数据库适配器单元测试
 *
 * @description 测试数据库适配器的基本功能
 * @since 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '@hl8/database';
import { PinoLogger } from '@hl8/logger';
import {
  DatabaseAdapter,
  IDatabaseConfig,
  DatabaseType,
} from './database.adapter';

describe('DatabaseAdapter', () => {
  let adapter: DatabaseAdapter;
  let mockDatabaseService: any;
  let mockLogger: jest.Mocked<PinoLogger>;

  beforeEach(async () => {
    const mockDatabaseServiceInstance = {
      query: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      transaction: jest.fn(),
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
          provide: DatabaseAdapter,
          useFactory: (
            databaseService: DatabaseService,
            logger: PinoLogger
          ) => {
            return new DatabaseAdapter(databaseService, logger, {});
          },
          inject: [DatabaseService, PinoLogger],
        },
        {
          provide: DatabaseService,
          useValue: mockDatabaseServiceInstance,
        },
        {
          provide: PinoLogger,
          useValue: mockLoggerInstance,
        },
      ],
    }).compile();

    adapter = module.get<DatabaseAdapter>(DatabaseAdapter);
    mockDatabaseService = mockDatabaseServiceInstance;
    mockLogger = module.get<PinoLogger>(PinoLogger) as jest.Mocked<PinoLogger>;
  });

  describe('query', () => {
    it('应该执行查询并返回结果', async () => {
      const query = 'SELECT * FROM users WHERE id = ?';
      const params = ['123'];
      const expectedResult = [{ id: '123', name: 'John' }];

      mockDatabaseService.query.mockResolvedValue(expectedResult);

      const result = await adapter.query(query, params);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(query, params);
      expect(result).toEqual(expectedResult);
    });

    it('应该处理查询错误', async () => {
      const query = 'SELECT * FROM users WHERE id = ?';
      const params = ['123'];
      const error = new Error('Database error');

      mockDatabaseService.query.mockRejectedValue(error);

      await expect(adapter.query(query, params)).rejects.toThrow(error);
    });

    it('应该记录查询日志', async () => {
      const query = 'SELECT * FROM users';
      const params: any[] = [];

      mockDatabaseService.query.mockResolvedValue([]);

      await adapter.query(query, params, { logQuery: true });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('执行查询:'),
        expect.objectContaining({
          query: query.substring(0, 100),
          params,
        })
      );
    });
  });

  describe('transaction', () => {
    it('应该执行事务', async () => {
      const callback = jest.fn().mockResolvedValue('result');
      const expectedResult = 'result';

      mockDatabaseService.transaction.mockResolvedValue(expectedResult);

      const result = await adapter.transaction(callback);

      expect(mockDatabaseService.transaction).toHaveBeenCalledWith(
        callback,
        {}
      );
      expect(result).toEqual(expectedResult);
    });

    it('应该处理事务错误', async () => {
      const callback = jest
        .fn()
        .mockRejectedValue(new Error('Transaction error'));
      const error = new Error('Transaction error');

      mockDatabaseService.transaction.mockRejectedValue(error);

      await expect(adapter.transaction(callback)).rejects.toThrow(error);
    });

    it('应该传递事务选项', async () => {
      const callback = jest.fn().mockResolvedValue('result');
      const options = {
        isolationLevel: 'READ_COMMITTED' as const,
        timeout: 30000,
        readOnly: false,
      };

      mockDatabaseService.transaction.mockResolvedValue('result');

      await adapter.transaction(callback, options);

      expect(mockDatabaseService.transaction).toHaveBeenCalledWith(
        callback,
        options
      );
    });
  });

  describe('insert', () => {
    it('应该插入数据', async () => {
      const table = 'users';
      const data = { name: 'John', email: 'john@example.com' };
      const expectedResult = { id: '123', ...data };

      mockDatabaseService.insert.mockResolvedValue(expectedResult);

      const result = await adapter.insert(table, data);

      expect(mockDatabaseService.insert).toHaveBeenCalledWith(table, data);
      expect(result).toEqual(expectedResult);
    });

    it('应该插入批量数据', async () => {
      const table = 'users';
      const data = [
        { name: 'John', email: 'john@example.com' },
        { name: 'Jane', email: 'jane@example.com' },
      ];
      const expectedResult = [
        { id: '123', ...data[0] },
        { id: '124', ...data[1] },
      ];

      mockDatabaseService.insert.mockResolvedValue(expectedResult);

      const result = await adapter.insert(table, data);

      expect(mockDatabaseService.insert).toHaveBeenCalledWith(table, data);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('应该更新数据', async () => {
      const table = 'users';
      const data = { name: 'John Updated' };
      const where = { id: '123' };
      const expectedResult = { affectedRows: 1 };

      mockDatabaseService.update.mockResolvedValue(expectedResult);

      const result = await adapter.update(table, data, where);

      expect(mockDatabaseService.update).toHaveBeenCalledWith(
        table,
        data,
        where
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('delete', () => {
    it('应该删除数据', async () => {
      const table = 'users';
      const where = { id: '123' };
      const expectedResult = { affectedRows: 1 };

      mockDatabaseService.delete.mockResolvedValue(expectedResult);

      const result = await adapter.delete(table, where);

      expect(mockDatabaseService.delete).toHaveBeenCalledWith(table, where);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('find', () => {
    it('应该查找数据', async () => {
      const table = 'users';
      const where = { active: true };
      const expectedResult = [
        { id: '123', name: 'John', active: true },
        { id: '124', name: 'Jane', active: true },
      ];

      mockDatabaseService.find.mockResolvedValue(expectedResult);

      const result = await adapter.find(table, where);

      expect(mockDatabaseService.find).toHaveBeenCalledWith(table, where);
      expect(result).toEqual(expectedResult);
    });

    it('应该使用默认where条件', async () => {
      const table = 'users';
      const expectedResult = [{ id: '123', name: 'John' }];

      mockDatabaseService.find.mockResolvedValue(expectedResult);

      const result = await adapter.find(table);

      expect(mockDatabaseService.find).toHaveBeenCalledWith(table, {});
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('应该查找单条数据', async () => {
      const table = 'users';
      const where = { id: '123' };
      const expectedResult = { id: '123', name: 'John' };

      mockDatabaseService.findOne.mockResolvedValue(expectedResult);

      const result = await adapter.findOne(table, where);

      expect(mockDatabaseService.findOne).toHaveBeenCalledWith(table, where);
      expect(result).toEqual(expectedResult);
    });

    it('应该返回null当数据不存在时', async () => {
      const table = 'users';
      const where = { id: 'non-existent' };

      mockDatabaseService.findOne.mockResolvedValue(null);

      const result = await adapter.findOne(table, where);

      expect(result).toBeNull();
    });
  });

  describe('count', () => {
    it('应该计数数据', async () => {
      const table = 'users';
      const where = { active: true };
      const expectedResult = 5;

      mockDatabaseService.count.mockResolvedValue(expectedResult);

      const result = await adapter.count(table, where);

      expect(mockDatabaseService.count).toHaveBeenCalledWith(table, where);
      expect(result).toEqual(expectedResult);
    });

    it('应该使用默认where条件', async () => {
      const table = 'users';
      const expectedResult = 10;

      mockDatabaseService.count.mockResolvedValue(expectedResult);

      const result = await adapter.count(table);

      expect(mockDatabaseService.count).toHaveBeenCalledWith(table, {});
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getDatabaseStatistics', () => {
    it('应该返回数据库统计信息', () => {
      const stats = adapter.getDatabaseStatistics();

      expect(stats).toHaveProperty('totalQueries');
      expect(stats).toHaveProperty('cachedQueries');
      expect(stats).toHaveProperty('slowQueries');
      expect(stats).toHaveProperty('averageQueryTime');
      expect(stats).toHaveProperty('cacheHitRate');
      expect(stats).toHaveProperty('slowQueryRate');
    });
  });

  describe('resetStatistics', () => {
    it('应该重置统计信息', () => {
      adapter.resetStatistics();

      const stats = adapter.getDatabaseStatistics();
      expect(stats.totalQueries).toBe(0);
      expect(stats.cachedQueries).toBe(0);
      expect(stats.slowQueries).toBe(0);
      expect(stats.averageQueryTime).toBe(0);
    });
  });

  describe('clearQueryCache', () => {
    it('应该清除查询缓存', () => {
      adapter.clearQueryCache();

      // 验证缓存已清除（通过统计信息验证）
      const stats = adapter.getDatabaseStatistics();
      expect(stats.totalQueries).toBe(0);
    });
  });
});
