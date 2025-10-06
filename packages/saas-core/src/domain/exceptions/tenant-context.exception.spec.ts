/**
 * 租户上下文异常测试
 *
 * @description 测试租户上下文异常类的功能
 * 验证异常创建、消息格式和上下文信息
 *
 * @since 1.0.0
 */

import { TenantContextException } from './tenant-context.exception';

describe('TenantContextException', () => {
  describe('基础异常创建', () => {
    it('应该正确创建基础异常', () => {
      const message = '测试异常消息';
      const context = {
        tenantId: 'tenant-123',
        userId: 'user-456',
        operation: 'test-operation'
      };

      const exception = new TenantContextException(message, context);

      expect(exception.message).toBe(message);
      expect(exception.code).toBe('TENANT_CONTEXT_ERROR');
      expect(exception.context).toEqual(context);
    });

    it('应该在没有上下文时正确创建异常', () => {
      const message = '测试异常消息';
      const exception = new TenantContextException(message);

      expect(exception.message).toBe(message);
      expect(exception.code).toBe('TENANT_CONTEXT_ERROR');
      expect(exception.context).toBeUndefined();
    });
  });

  describe('静态工厂方法', () => {
    it('应该创建用户未分配租户异常', () => {
      const userId = 'user-123';
      const exception = TenantContextException.userNotAssignedToTenant(userId);

      expect(exception.message).toContain('用户 user-123 未分配到任何租户');
      expect(exception.code).toBe('TENANT_CONTEXT_ERROR');
      expect(exception.context?.userId).toBe(userId);
      expect(exception.context?.operation).toBe('getTenantContext');
      expect(exception.context?.reason).toBe('user_not_assigned_to_tenant');
    });

    it('应该创建缺少租户上下文异常', () => {
      const operation = 'test-operation';
      const exception = TenantContextException.missingTenantContext(operation);

      expect(exception.message).toContain('操作 test-operation 缺少租户上下文');
      expect(exception.code).toBe('TENANT_CONTEXT_ERROR');
      expect(exception.context?.operation).toBe(operation);
      expect(exception.context?.reason).toBe('missing_tenant_context');
    });

    it('应该创建租户上下文无效异常', () => {
      const tenantId = 'tenant-123';
      const reason = 'invalid_format';
      const exception = TenantContextException.invalidTenantContext(tenantId, reason);

      expect(exception.message).toContain('租户 tenant-123 上下文无效');
      expect(exception.message).toContain(reason);
      expect(exception.code).toBe('TENANT_CONTEXT_ERROR');
      expect(exception.context?.tenantId).toBe(tenantId);
      expect(exception.context?.reason).toBe('invalid_tenant_context');
    });

    it('应该创建跨租户访问权限不足异常', () => {
      const userId = 'user-123';
      const targetTenantId = 'tenant-456';
      const userTenantIds = ['tenant-123', 'tenant-789'];
      const exception = TenantContextException.insufficientCrossTenantAccess(
        userId,
        targetTenantId,
        userTenantIds
      );

      expect(exception.message).toContain('用户 user-123 无权限访问租户 tenant-456');
      expect(exception.code).toBe('TENANT_CONTEXT_ERROR');
      expect(exception.context?.userId).toBe(userId);
      expect(exception.context?.tenantId).toBe(targetTenantId);
      expect(exception.context?.operation).toBe('cross_tenant_access');
      expect(exception.context?.reason).toBe('insufficient_permission');
    });

    it('应该创建租户ID格式无效异常', () => {
      const tenantId = 'invalid-tenant-id';
      const exception = TenantContextException.invalidTenantIdFormat(tenantId);

      expect(exception.message).toContain('租户ID格式无效: invalid-tenant-id');
      expect(exception.code).toBe('TENANT_CONTEXT_ERROR');
      expect(exception.context?.tenantId).toBe(tenantId);
      expect(exception.context?.reason).toBe('invalid_tenant_id_format');
    });

    it('应该创建租户不存在异常', () => {
      const tenantId = 'non-existent-tenant';
      const exception = TenantContextException.tenantNotFound(tenantId);

      expect(exception.message).toContain('租户不存在: non-existent-tenant');
      expect(exception.code).toBe('TENANT_CONTEXT_ERROR');
      expect(exception.context?.tenantId).toBe(tenantId);
      expect(exception.context?.reason).toBe('tenant_not_found');
    });

    it('应该创建租户状态无效异常', () => {
      const tenantId = 'tenant-123';
      const currentStatus = 'SUSPENDED';
      const requiredStatus = 'ACTIVE';
      const exception = TenantContextException.invalidTenantStatus(
        tenantId,
        currentStatus,
        requiredStatus
      );

      expect(exception.message).toContain('租户 tenant-123 状态无效');
      expect(exception.message).toContain('当前状态: SUSPENDED');
      expect(exception.message).toContain('要求状态: ACTIVE');
      expect(exception.code).toBe('TENANT_CONTEXT_ERROR');
      expect(exception.context?.tenantId).toBe(tenantId);
      expect(exception.context?.reason).toBe('invalid_tenant_status');
    });
  });

  describe('异常继承', () => {
    it('应该正确继承SaasDomainException', () => {
      const exception = new TenantContextException('测试消息');
      
      expect(exception).toBeInstanceOf(TenantContextException);
      expect(exception).toBeInstanceOf(Error);
    });

    it('应该包含正确的异常类型信息', () => {
      const exception = new TenantContextException('测试消息');
      
      expect(exception.name).toBe('TenantContextException');
      expect(exception.code).toBe('TENANT_CONTEXT_ERROR');
    });
  });

  describe('异常消息格式', () => {
    it('应该提供中文错误消息', () => {
      const exception = new TenantContextException('测试消息');
      
      expect(exception.message).toBe('测试消息');
      expect(exception.code).toBe('TENANT_CONTEXT_ERROR');
    });

    it('应该在静态工厂方法中提供描述性消息', () => {
      const userId = 'user-123';
      const exception = TenantContextException.userNotAssignedToTenant(userId);
      
      expect(exception.message).toBe(`用户 ${userId} 未分配到任何租户`);
    });
  });

  describe('上下文信息', () => {
    it('应该正确存储上下文信息', () => {
      const context = {
        tenantId: 'tenant-123',
        userId: 'user-456',
        operation: 'test-operation',
        reason: 'test_reason'
      };
      
      const exception = new TenantContextException('测试消息', context);
      
      expect(exception.context).toEqual(context);
    });

    it('应该在静态工厂方法中自动填充上下文', () => {
      const exception = TenantContextException.missingTenantContext('test-operation');
      
      expect(exception.context?.operation).toBe('test-operation');
      expect(exception.context?.reason).toBe('missing_tenant_context');
    });
  });
});
