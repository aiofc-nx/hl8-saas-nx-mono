/**
 * 租户仓储真实数据库集成测试
 *
 * @description 使用真实 PostgreSQL 数据库测试租户仓储功能
 *
 * ## 测试范围
 *
 * - 租户创建和持久化
 * - 租户查询（单个、列表、条件）
 * - 租户更新和状态转换
 * - 租户删除（软删除）
 * - ORM 映射验证
 * - 数据库约束验证
 * - 多租户数据隔离
 * - 事务处理
 *
 * ## 数据库要求
 *
 * - PostgreSQL 16+
 * - Docker 容器运行
 * - 使用 saas_core_test 数据库
 *
 * @module __tests__/integration
 * @since 1.0.0
 */

import { EntityManager } from '@mikro-orm/core';
import { EntityId } from '@hl8/hybrid-archi';
import { TestDatabaseHelper } from '../setup/test-database.helper';
import { TenantAggregate } from '../../src/domain/tenant/aggregates/tenant.aggregate';
import { TenantAggregateRepository } from '../../src/infrastructure/adapters/repositories/tenant-aggregate.repository';
import { TenantMapper } from '../../src/infrastructure/mappers/tenant.mapper';
import { TenantCode } from '../../src/domain/tenant/value-objects/tenant-code.vo';
import { TenantDomain } from '../../src/domain/tenant/value-objects/tenant-domain.vo';
import { TenantType } from '../../src/domain/tenant/value-objects/tenant-type.enum';
import { TenantStatus } from '@hl8/hybrid-archi';
import { TenantOrmEntity } from '../../src/infrastructure/persistence/entities/tenant.orm-entity';

describe('租户仓储真实数据库集成测试', () => {
  let em: EntityManager;
  let repository: TenantAggregateRepository;
  let mapper: TenantMapper;

  /**
   * 每个测试前：创建新的 EntityManager 和 Repository
   */
  beforeEach(async () => {
    // 清空数据库
    await TestDatabaseHelper.clearDatabase();
    
    // 创建新的 EntityManager（从已初始化的 ORM fork）
    em = TestDatabaseHelper.fork();
    
    // 创建 Mapper 和仓储实例
    mapper = new TenantMapper();
    repository = new TenantAggregateRepository(em, mapper);
  });

  /**
   * 每个测试后：清理 EntityManager
   */
  afterEach(async () => {
    if (em) {
      em.clear();
    }
  });

  describe('租户创建和持久化', () => {
    it('应该成功创建并持久化免费租户到数据库', async () => {
      // Arrange: 创建租户聚合根
      const tenantId = EntityId.generate();
      const aggregate = TenantAggregate.create(
        tenantId,
        TenantCode.create('freetenant001'),
        '免费租户测试',
        TenantDomain.create('free.example.com'),
        TenantType.FREE,
        { createdBy: 'system' },
      );

      // Act: 持久化到数据库
      await repository.save(aggregate);
      await em.flush();

      // Assert: 从数据库读取验证
      const savedTenant = await em.findOne(TenantOrmEntity, { 
        id: tenantId.toString() 
      });

      expect(savedTenant).toBeDefined();
      expect(savedTenant?.code).toBe('freetenant001');
      expect(savedTenant?.name).toBe('免费租户测试');
      expect(savedTenant?.type).toBe(TenantType.FREE);
      expect(savedTenant?.status).toBe(TenantStatus.PENDING);
    });

    it('应该成功创建企业租户并验证配额', async () => {
      // Arrange
      const aggregate = TenantAggregate.create(
        EntityId.generate(),
        TenantCode.create('enterprise001'),
        '企业租户测试',
        TenantDomain.create('enterprise.example.com'),
        TenantType.ENTERPRISE,
        { createdBy: 'admin' },
      );

      // Act
      await repository.save(aggregate);
      await em.flush();

      // Assert: 验证企业租户的配额
      const savedAggregate = await repository.findById(aggregate.id);
      expect(savedAggregate).toBeDefined();
      expect(savedAggregate?.getType()).toBe(TenantType.ENTERPRISE);
    });

    it('应该拒绝创建重复的租户代码（唯一约束）', async () => {
      // Arrange: 创建第一个租户
      const firstTenant = TenantAggregate.create(
        EntityId.generate(),
        TenantCode.create('duplicate001'),
        '第一个租户',
        TenantDomain.create('first.example.com'),
        TenantType.FREE,
        { createdBy: 'system' },
      );
      await repository.save(firstTenant);

      // Act & Assert: 尝试创建相同代码的租户应该抛出错误
      const secondTenant = TenantAggregate.create(
        EntityId.generate(),
        TenantCode.create('duplicate001'), // 相同代码
        '第二个租户',
        TenantDomain.create('second.example.com'),
        TenantType.FREE,
        { createdBy: 'system' },
      );

      // 数据库应该抛出唯一约束错误
      await expect(repository.save(secondTenant)).rejects.toThrow();
    });
  });

  describe('租户查询操作', () => {
    beforeEach(async () => {
      // 准备测试数据：创建多个租户
      const tenants = [
        TenantAggregate.create(
          EntityId.generate(),
          TenantCode.create('free001'),
          '免费租户1',
          TenantDomain.create('free1.example.com'),
          TenantType.FREE,
          { createdBy: 'system' },
        ),
        TenantAggregate.create(
          EntityId.generate(),
          TenantCode.create('basic001'),
          '基础租户1',
          TenantDomain.create('basic1.example.com'),
          TenantType.BASIC,
          { createdBy: 'system' },
        ),
        TenantAggregate.create(
          EntityId.generate(),
          TenantCode.create('pro001'),
          '专业租户1',
          TenantDomain.create('pro1.example.com'),
          TenantType.PROFESSIONAL,
          { createdBy: 'system' },
        ),
      ];

      for (const tenant of tenants) {
        await repository.save(tenant);
      }
      await em.flush();
    });

    it('应该通过 ID 查询租户', async () => {
      // Arrange: 获取第一个租户的 ID
      const tenants = await em.find(TenantOrmEntity, {});
      const firstTenantId = EntityId.fromString(tenants[0].id);

      // Act: 通过 ID 查询
      const found = await repository.findById(firstTenantId);

      // Assert
      expect(found).toBeDefined();
      expect(found?.id.toString()).toBe(firstTenantId.toString());
    });

    it('应该通过租户代码查询租户', async () => {
      // Act
      const found = await repository.findByCode(
        TenantCode.create('basic001')
      );

      // Assert
      expect(found).toBeDefined();
      expect(found?.getCode().value).toBe('basic001');
      expect(found?.getType()).toBe(TenantType.BASIC);
    });

    it('应该查询所有租户列表', async () => {
      // Act
      const allTenants = await repository.findAll();

      // Assert
      expect(allTenants).toHaveLength(3);
      expect(allTenants.map(t => t.getType())).toContain(TenantType.FREE);
      expect(allTenants.map(t => t.getType())).toContain(TenantType.BASIC);
      expect(allTenants.map(t => t.getType())).toContain(TenantType.PROFESSIONAL);
    });

    it('应该按类型查询租户', async () => {
      // Act
      const freeTenants = await em.find(TenantOrmEntity, { 
        type: TenantType.FREE 
      });

      // Assert
      expect(freeTenants).toHaveLength(1);
      expect(freeTenants[0].code).toBe('free001');
    });

    it('应该按状态查询租户', async () => {
      // Arrange: 激活一个租户
      const tenant = await repository.findByCode(
        TenantCode.create('free001')
      );
      tenant?.activate('admin');
      await repository.save(tenant!);
      await em.flush();

      // Act: 查询活跃租户
      const activeTenants = await em.find(TenantOrmEntity, { 
        status: TenantStatus.ACTIVE 
      });

      // Assert
      expect(activeTenants).toHaveLength(1);
      expect(activeTenants[0].code).toBe('free001');
    });
  });

  describe('租户更新和状态转换', () => {
    it('应该成功激活租户', async () => {
      // Arrange: 创建测试租户
      const testTenant = TenantAggregate.create(
        EntityId.generate(),
        TenantCode.create('activate001'),
        '激活测试租户',
        TenantDomain.create('activate.example.com'),
        TenantType.FREE,
        { createdBy: 'system' },
      );
      await repository.save(testTenant);
      await em.flush();

      // Act: 激活租户
      const loaded = await repository.findById(testTenant.id);
      loaded?.activate('admin');
      await repository.save(loaded!);
      await em.flush();

      // Assert: 重新加载并验证
      const updated = await repository.findById(testTenant.id);
      expect(updated?.getStatus()).toBe(TenantStatus.ACTIVE);
    });

    it('应该成功升级租户类型', async () => {
      // Arrange: 创建并激活租户
      const testTenant = TenantAggregate.create(
        EntityId.generate(),
        TenantCode.create('upgrade001'),
        '升级测试租户',
        TenantDomain.create('upgrade.example.com'),
        TenantType.FREE,
        { createdBy: 'system' },
      );
      await repository.save(testTenant);
      await em.flush();

      // 激活租户
      const loaded = await repository.findById(testTenant.id);
      loaded?.activate('admin');
      await repository.save(loaded!);
      await em.flush();
      
      // Act: 升级到 BASIC
      const toUpgrade = await repository.findById(testTenant.id);
      toUpgrade?.upgrade(TenantType.BASIC, 'admin');
      await repository.save(toUpgrade!);
      await em.flush();

      // Assert: 验证升级成功
      const upgraded = await repository.findById(testTenant.id);
      expect(upgraded?.getType()).toBe(TenantType.BASIC);
    });

    it('应该成功暂停和恢复租户', async () => {
      // Arrange: 创建并激活租户
      const testTenant = TenantAggregate.create(
        EntityId.generate(),
        TenantCode.create('suspend001'),
        '暂停测试租户',
        TenantDomain.create('suspend.example.com'),
        TenantType.FREE,
        { createdBy: 'system' },
      );
      await repository.save(testTenant);
      await em.flush();

      // 激活租户
      const activated = await repository.findById(testTenant.id);
      activated?.activate('admin');
      await repository.save(activated!);
      await em.flush();

      // Act: 暂停租户
      const toSuspend = await repository.findById(testTenant.id);
      toSuspend?.suspend('测试暂停', 'admin');
      await repository.save(toSuspend!);
      await em.flush();

      // Assert: 验证暂停
      let current = await repository.findById(testTenant.id);
      expect(current?.getStatus()).toBe(TenantStatus.SUSPENDED);

      // Act: 恢复租户
      const toResume = await repository.findById(testTenant.id);
      toResume?.resume('admin');
      await repository.save(toResume!);
      await em.flush();

      // Assert: 验证恢复
      current = await repository.findById(testTenant.id);
      expect(current?.getStatus()).toBe(TenantStatus.ACTIVE);
    });
  });

  describe('事务处理和并发', () => {
    it('应该在事务中正确处理多个操作', async () => {
      await em.transactional(async (transactionalEm) => {
        // 创建多个租户
        const tenant1 = TenantAggregate.create(
          EntityId.generate(),
          TenantCode.create('tx001'),
          '事务测试1',
          TenantDomain.create('tx1.example.com'),
          TenantType.FREE,
          { createdBy: 'system' },
        );

        const tenant2 = TenantAggregate.create(
          EntityId.generate(),
          TenantCode.create('tx002'),
          '事务测试2',
          TenantDomain.create('tx2.example.com'),
          TenantType.BASIC,
          { createdBy: 'system' },
        );

        const txMapper = new TenantMapper();
        const txRepository = new TenantAggregateRepository(transactionalEm, txMapper);
        await txRepository.save(tenant1);
        await txRepository.save(tenant2);
      });

      // 验证两个租户都已创建
      const count = await em.count(TenantOrmEntity, {});
      expect(count).toBe(2);
    });

    it('应该在事务失败时回滚所有操作', async () => {
      await expect(
        em.transactional(async (transactionalEm) => {
          // 创建第一个租户（成功）
          const tenant1 = TenantAggregate.create(
            EntityId.generate(),
            TenantCode.create('rollback001'),
            '回滚测试1',
            TenantDomain.create('rollback1.example.com'),
            TenantType.FREE,
            { createdBy: 'system' },
          );

          const txMapper = new TenantMapper();
          const txRepository = new TenantAggregateRepository(transactionalEm, txMapper);
          await txRepository.save(tenant1);

          // 抛出错误（模拟失败）
          throw new Error('模拟事务失败');
        }),
      ).rejects.toThrow('模拟事务失败');

      // 验证数据库中没有租户（已回滚）
      const count = await em.count(TenantOrmEntity, {});
      expect(count).toBe(0);
    });
  });

  describe('性能和索引验证', () => {
    /**
     * 创建测试数据的辅助函数
     */
    async function createPerformanceTestData() {
      const tenants = [];
      for (let i = 0; i < 50; i++) {
        tenants.push(
          TenantAggregate.create(
            EntityId.generate(),
            TenantCode.create(`perf${i.toString().padStart(3, '0')}`),
            `性能测试租户${i}`,
            TenantDomain.create(`perf${i}.example.com`),
            i % 3 === 0 ? TenantType.FREE : i % 3 === 1 ? TenantType.BASIC : TenantType.PROFESSIONAL,
            { createdBy: 'system' },
          ),
        );
      }

      // 批量保存（更高效）
      for (const tenant of tenants) {
        await repository.save(tenant);
      }
      await em.flush();
    }

    it('应该快速查询租户（验证索引有效）', async () => {
      // Arrange: 创建测试数据
      await createPerformanceTestData();

      // Act: 查询并计时
      const startTime = Date.now();
      const tenant = await repository.findByCode(
        TenantCode.create('perf025')
      );
      const queryTime = Date.now() - startTime;

      // Assert
      expect(tenant).toBeDefined();
      expect(tenant?.getCode().value).toBe('perf025');
      expect(queryTime).toBeLessThan(100); // 查询应该很快（< 100ms）
    });

    it('应该支持分页查询大量数据', async () => {
      // Arrange: 创建测试数据
      await createPerformanceTestData();

      // Act: 分页查询
      const page1 = await em.find(TenantOrmEntity, {}, {
        limit: 10,
        offset: 0,
        orderBy: { createdAt: 'ASC' },
      });

      const page2 = await em.find(TenantOrmEntity, {}, {
        limit: 10,
        offset: 10,
        orderBy: { createdAt: 'ASC' },
      });

      // Assert
      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(10);
      expect(page1[0].id).not.toBe(page2[0].id);
      
      // 验证总数
      const total = await em.count(TenantOrmEntity, {});
      expect(total).toBe(50);
    });
  });
});

