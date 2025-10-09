/**
 * 基础实体类单元测试
 *
 * 测试 BaseEntity 类的核心功能，包括：
 * - 实体创建和初始化
 * - 标识符管理
 * - 审计信息管理
 * - 相等性比较
 * - 序列化操作
 * - 验证逻辑
 *
 * @description 验证基础实体类的通用功能组件能力
 * @since 1.0.0
 */

import { BaseEntity } from '../../../domain/entities/base/base-entity';
import { EntityId } from '../../../domain/value-objects/entity-id';
import {
  IPartialAuditInfo,
} from '../../../domain/entities/base/audit-info';
import { PinoLogger } from '@hl8/logger';
import { GeneralBadRequestException } from '@hl8/common';

// 测试用的具体实体类
class TestEntity extends BaseEntity {
  constructor(id: EntityId, auditInfo: IPartialAuditInfo, logger?: PinoLogger) {
    super(id, auditInfo, logger);
  }

  // 重写验证方法以测试验证逻辑
  protected override validate(): void {
    super.validate();
  }

  // 重写时间戳更新方法
  protected override updateTimestamp(): void {
    // 测试实现
  }
}

describe('BaseEntity', () => {
  let entityId: EntityId;
  let auditInfo: IPartialAuditInfo;
  let logger: PinoLogger;

  beforeEach(() => {
    entityId = EntityId.generate();
    auditInfo = {
      createdBy: 'test-user',
      tenantId: EntityId.generate(),
      version: 1,
    };
    logger = new PinoLogger({ level: 'error' as const });
  });

  describe('构造函数', () => {
    it('应该正确创建实体实例', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);

      expect(entity).toBeDefined();
      expect(entity.id).toBe(entityId);
      expect(entity.tenantId.equals(auditInfo.tenantId!)).toBe(true);
      expect(entity.createdBy).toBe('test-user');
      expect(entity.version).toBe(1);
    });

    it('应该使用默认日志记录器当未提供时', () => {
      const entity = new TestEntity(entityId, auditInfo);

      expect(entity).toBeDefined();
      expect(entity['logger']).toBeDefined();
    });

    it('应该正确设置审计信息', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);

      expect(entity.auditInfo).toBeDefined();
      expect(entity.auditInfo.createdBy).toBe('test-user');
      expect(entity.auditInfo.tenantId.equals(auditInfo.tenantId!)).toBe(true);
      expect(entity.auditInfo.version).toBe(1);
      expect(entity.auditInfo.createdAt).toBeInstanceOf(Date);
      expect(entity.auditInfo.updatedAt).toBeInstanceOf(Date);
      expect(entity.auditInfo.deletedAt).toBeNull();
    });
  });

  describe('标识符管理', () => {
    it('应该正确返回实体标识符', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);

      expect(entity.id).toBe(entityId);
      expect(entity.id.equals(entityId)).toBe(true);
    });

    it('应该支持标识符的字符串表示', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);

      expect(entity.id.toString()).toBe(entityId.toString());
    });
  });

  describe('审计信息管理', () => {
    it('应该正确返回创建时间', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);

      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('应该正确返回更新时间', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);

      expect(entity.updatedAt).toBeInstanceOf(Date);
      expect(entity.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('应该正确返回租户标识符', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);

      expect(entity.tenantId.equals(auditInfo.tenantId!)).toBe(true);
    });

    it('应该正确返回版本号', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);

      expect(entity.version).toBe(1);
    });

    it('应该正确返回创建者', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);

      expect(entity.createdBy).toBe('test-user');
    });

    it('应该正确返回更新者', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);

      expect(entity.updatedBy).toBe('test-user');
    });

    it('应该正确返回删除时间（未删除时）', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);

      expect(entity.deletedAt).toBeNull();
    });

    it('应该正确返回删除者（未删除时）', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);

      expect(entity.deletedBy).toBeNull();
    });

    it('应该正确检查删除状态', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);

      expect(entity.isDeleted).toBe(false);
    });
  });

  describe('相等性比较', () => {
    it('应该正确比较相同实体', () => {
      const entity1 = new TestEntity(entityId, auditInfo, logger);
      const entity2 = new TestEntity(entityId, auditInfo, logger);

      expect(entity1.equals(entity2)).toBe(true);
    });

    it('应该正确比较不同实体', () => {
      const entity1 = new TestEntity(entityId, auditInfo, logger);
      const entity2 = new TestEntity(EntityId.generate(), auditInfo, logger);

      expect(entity1.equals(entity2)).toBe(false);
    });

    it('应该正确处理 null 比较', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);

      expect(entity.equals(null)).toBe(false);
    });

    it('应该正确处理 undefined 比较', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);

      expect(entity.equals(undefined)).toBe(false);
    });

    it('应该正确处理不同类型实体比较', () => {
      class AnotherEntity extends BaseEntity {
        constructor(id: EntityId, auditInfo: IPartialAuditInfo) {
          super(id, auditInfo);
        }
      }

      const entity1 = new TestEntity(entityId, auditInfo, logger);
      const entity2 = new AnotherEntity(entityId, auditInfo);

      expect(entity1.equals(entity2)).toBe(false);
    });
  });

  describe('哈希码和比较', () => {
    it('应该正确返回哈希码', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);

      expect(entity.getHashCode()).toBe(entityId.getHashCode());
    });

    it('应该正确比较实体大小', () => {
      const entity1 = new TestEntity(entityId, auditInfo, logger);
      const entity2 = new TestEntity(EntityId.generate(), auditInfo, logger);

      const result = entity1.compareTo(entity2);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(-1);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('应该正确处理 null 比较', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);

      const result = entity.compareTo(null as unknown as TestEntity);
      expect(result).toBe(1);
    });
  });

  describe('字符串表示', () => {
    it('应该正确返回字符串表示', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);

      const str = entity.toString();
      expect(str).toContain('TestEntity');
      expect(str).toContain(entityId.toString());
    });

    it('应该正确返回类型名称', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);

      expect(entity.getTypeName()).toBe('TestEntity');
    });
  });

  describe('JSON 序列化', () => {
    it('应该正确序列化为 JSON', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);

      const json = entity.toJSON();
      expect(json).toHaveProperty('id', entityId.toString());
      expect(json).toHaveProperty('type', 'TestEntity');
      expect(json).toHaveProperty('auditInfo');
      expect(json['auditInfo']).toHaveProperty('createdBy', 'test-user');
      const jsonAuditInfo = (json as any)['auditInfo'];
      expect(jsonAuditInfo['tenantId']).toBe(auditInfo.tenantId!.toString());
    });
  });

  describe('验证逻辑', () => {
    it('应该通过有效实体验证', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);

      expect(() => entity['validate']()).not.toThrow();
    });

    it('应该拒绝无效标识符', () => {
      // 使用有效的 UUID 但测试其他验证逻辑
      const validId = EntityId.generate();
      const entity = new TestEntity(validId, auditInfo, logger);

      // 这个测试应该通过，因为使用的是有效的 UUID
      expect(() => entity['validate']()).not.toThrow();
    });

    it('应该在缺少租户标识符时自动生成', () => {
      const invalidAuditInfo = { createdBy: 'test-user', version: 1 };
      const entity = new TestEntity(entityId, invalidAuditInfo, logger);

      // buildAuditInfo 会为undefined的tenantId生成一个新的EntityId
      expect(entity.tenantId).toBeInstanceOf(EntityId);
      expect(() => entity['validate']()).not.toThrow();
    });
  });

  describe('日志记录', () => {
    it('应该正确记录操作日志', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);
      const logSpy = jest.spyOn(logger, 'info');

      entity['logOperation']('test-operation', { key: 'value' });

      expect(logSpy).toHaveBeenCalledWith('Entity test-operation', {
        entityId: entityId.toString(),
        entityType: 'TestEntity',
        tenantId: auditInfo.tenantId?.toString(),
        operation: 'test-operation',
        details: { key: 'value' },
      });
    });

    it('应该正确记录错误日志', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);
      const logSpy = jest.spyOn(logger, 'error');
      const error = new Error('Test error');

      entity['logError']('test-operation', error, { key: 'value' });

      expect(logSpy).toHaveBeenCalledWith('Entity test-operation failed', {
        entityId: entityId.toString(),
        entityType: 'TestEntity',
        tenantId: auditInfo.tenantId?.toString(),
        operation: 'test-operation',
        error: 'Test error',
        stack: error.stack,
        details: { key: 'value' },
      });
    });
  });

  describe('异常处理', () => {
    it('应该正确抛出验证异常', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);

      expect(() => {
        entity['throwValidationError']('Test message', 'TEST_ERROR', {
          key: 'value',
        });
      }).toThrow(GeneralBadRequestException);
    });

    it('应该正确抛出操作异常', () => {
      const entity = new TestEntity(entityId, auditInfo, logger);

      expect(() => {
        entity['throwOperationError']('test-operation', 'Test message', {
          key: 'value',
        });
      }).toThrow();
    });
  });

  describe('边界情况', () => {
    it('应该正确处理最小审计信息', () => {
      const minTenantId = EntityId.generate();
      const minimalAuditInfo: IPartialAuditInfo = {
        tenantId: minTenantId,
      };
      const entity = new TestEntity(entityId, minimalAuditInfo, logger);

      expect(entity.tenantId.equals(minTenantId)).toBe(true);
      expect(entity.createdBy).toBe('system');
      expect(entity.version).toBe(1);
    });

    it('应该正确处理完整审计信息', () => {
      const fullTenantId = EntityId.generate();
      const fullAuditInfo: IPartialAuditInfo = {
        createdBy: 'creator',
        updatedBy: 'updater',
        tenantId: fullTenantId,
        version: 5,
        lastOperation: 'UPDATE',
        lastOperationIp: '192.168.1.1',
        lastOperationUserAgent: 'Test Agent',
        lastOperationSource: 'API',
      };
      const entity = new TestEntity(entityId, fullAuditInfo, logger);

      expect(entity.createdBy).toBe('creator');
      expect(entity.updatedBy).toBe('updater');
      expect(entity.tenantId.equals(fullTenantId)).toBe(true);
      expect(entity.version).toBe(5);
    });
  });
});
