/**
 * 基础实体测试
 *
 * 测试基础实体的核心功能，包括标识符、审计信息、相等性比较等。
 *
 * @description 基础实体的单元测试
 * @since 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BaseEntity } from './base-entity';
import { EntityId } from '../../value-objects/entity-id';
import { PinoLogger } from '@hl8/logger';
import { TenantContextService } from '@hl8/multi-tenancy';

describe('BaseEntity', () => {
  let entity: TestEntity;
  let logger: PinoLogger;
  let tenantContext: TenantContextService;

  class TestEntity extends BaseEntity {
    constructor(
      id: EntityId,
      private name: string,
      private email: string
    ) {
      super(id);
    }

    getName(): string {
      return this.name;
    }

    getEmail(): string {
      return this.email;
    }

    updateName(newName: string): void {
      this.name = newName;
      this.updateTimestamp();
    }

    updateEmail(newEmail: string): void {
      this.email = newEmail;
      this.updateTimestamp();
    }
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PinoLogger,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          },
        },
        {
          provide: TenantContextService,
          useValue: {
            getCurrentTenantId: jest.fn().mockReturnValue('tenant-123'),
            getCurrentUserId: jest.fn().mockReturnValue('user-123'),
          },
        },
      ],
    }).compile();

    logger = module.get<PinoLogger>(PinoLogger);
    tenantContext = module.get<TenantContextService>(TenantContextService);

    entity = new TestEntity(
      EntityId.generate(),
      'Test User',
      'test@example.com'
    );
  });

  describe('构造函数', () => {
    it('应该正确初始化实体', () => {
      expect(entity).toBeDefined();
      expect(entity.id).toBeDefined();
      expect(entity.getName()).toBe('Test User');
      expect(entity.getEmail()).toBe('test@example.com');
    });

    it('应该设置创建时间', () => {
      expect(entity.createdAt).toBeDefined();
      expect(entity.createdAt).toBeInstanceOf(Date);
    });

    it('应该设置租户ID', () => {
      expect(entity.tenantId).toBe('tenant-123');
    });

    it('应该设置创建者ID', () => {
      expect(entity.createdBy).toBe('user-123');
    });
  });

  describe('标识符', () => {
    it('应该具有唯一标识符', () => {
      const entity1 = new TestEntity(EntityId.generate(), 'User 1', 'user1@example.com');
      const entity2 = new TestEntity(EntityId.generate(), 'User 2', 'user2@example.com');

      expect(entity1.id).not.toEqual(entity2.id);
    });

    it('应该支持标识符比较', () => {
      const id = EntityId.generate();
      const entity1 = new TestEntity(id, 'User 1', 'user1@example.com');
      const entity2 = new TestEntity(id, 'User 2', 'user2@example.com');

      expect(entity1.id).toEqual(entity2.id);
    });
  });

  describe('相等性比较', () => {
    it('相同ID的实体应该相等', () => {
      const id = EntityId.generate();
      const entity1 = new TestEntity(id, 'User 1', 'user1@example.com');
      const entity2 = new TestEntity(id, 'User 2', 'user2@example.com');

      expect(entity1.equals(entity2)).toBe(true);
    });

    it('不同ID的实体应该不相等', () => {
      const entity1 = new TestEntity(EntityId.generate(), 'User 1', 'user1@example.com');
      const entity2 = new TestEntity(EntityId.generate(), 'User 2', 'user2@example.com');

      expect(entity1.equals(entity2)).toBe(false);
    });

    it('与null比较应该不相等', () => {
      expect(entity.equals(null)).toBe(false);
    });

    it('与undefined比较应该不相等', () => {
      expect(entity.equals(undefined)).toBe(false);
    });
  });

  describe('时间戳更新', () => {
    it('应该更新修改时间', () => {
      const originalUpdatedAt = entity.updatedAt;
      
      // 等待一小段时间确保时间戳不同
      setTimeout(() => {
        entity.updateName('Updated Name');
        expect(entity.updatedAt).not.toEqual(originalUpdatedAt);
        expect(entity.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });

    it('应该更新修改者', () => {
      entity.updateName('Updated Name');
      expect(entity.updatedBy).toBe('user-123');
    });
  });

  describe('JSON序列化', () => {
    it('应该正确序列化为JSON', () => {
      const json = entity.toJSON();
      
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
      expect(json).toHaveProperty('tenantId');
      expect(json).toHaveProperty('createdBy');
      expect(json).toHaveProperty('version');
    });

    it('应该包含所有必要字段', () => {
      const json = entity.toJSON();
      
      expect(json.id).toBe(entity.id.toString());
      expect(json.tenantId).toBe('tenant-123');
      expect(json.createdBy).toBe('user-123');
      expect(json.version).toBe(1);
    });
  });

  describe('哈希值', () => {
    it('应该生成一致的哈希值', () => {
      const hash1 = entity.hashCode();
      const hash2 = entity.hashCode();
      
      expect(hash1).toBe(hash2);
    });

    it('相同实体的哈希值应该相等', () => {
      const id = EntityId.generate();
      const entity1 = new TestEntity(id, 'User 1', 'user1@example.com');
      const entity2 = new TestEntity(id, 'User 2', 'user2@example.com');

      expect(entity1.hashCode()).toBe(entity2.hashCode());
    });
  });

  describe('版本管理', () => {
    it('应该正确管理版本号', () => {
      expect(entity.version).toBe(1);
      
      entity.updateName('Updated Name');
      expect(entity.version).toBe(2);
      
      entity.updateEmail('updated@example.com');
      expect(entity.version).toBe(3);
    });
  });

  describe('业务方法', () => {
    it('应该正确更新名称', () => {
      entity.updateName('New Name');
      expect(entity.getName()).toBe('New Name');
    });

    it('应该正确更新邮箱', () => {
      entity.updateEmail('new@example.com');
      expect(entity.getEmail()).toBe('new@example.com');
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的标识符', () => {
      expect(() => {
        new TestEntity(null as unknown as EntityId, 'User', 'user@example.com');
      }).toThrow();
    });

    it('应该处理空名称', () => {
      expect(() => {
        entity.updateName('');
      }).not.toThrow();
    });
  });

  describe('审计信息', () => {
    it('应该正确设置审计信息', () => {
      expect(entity.createdAt).toBeDefined();
      expect(entity.updatedAt).toBeDefined();
      expect(entity.tenantId).toBe('tenant-123');
      expect(entity.createdBy).toBe('user-123');
      expect(entity.updatedBy).toBe('user-123');
    });

    it('应该支持软删除', () => {
      entity.markAsDeleted();
      expect(entity.deletedAt).toBeDefined();
      expect(entity.deletedBy).toBe('user-123');
    });
  });
});
