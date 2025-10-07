/**
 * SAAS领域异常单元测试
 * 
 * @description 测试SAAS平台特定的领域异常类
 * 包括用户异常、租户异常、授权异常、组织架构异常等
 * 
 * @since 1.0.0
 */

import { EntityId } from '@hl8/hybrid-archi';
import { 
  UserExceptions,
  TenantExceptions,
  AuthorizationExceptions,
  OrganizationExceptions
} from './saas-domain-exceptions';

describe('SAAS Domain Exceptions', () => {
  describe('UserExceptions', () => {
    describe('UserStatusException', () => {
      it('should create user status exception with valid data', () => {
        // Arrange
        const message = 'User is not in pending status';
        const currentStatus = 'ACTIVE';
        const requestedOperation = 'activate';
        const userId = EntityId.generate().toString();

        // Act
        const exception = new UserExceptions.UserStatusException(
          message,
          currentStatus,
          requestedOperation,
          userId
        );

        // Assert
        expect(exception).toBeInstanceOf(UserExceptions.UserStatusException);
        expect(exception.message).toBe(message);
        expect(exception.name).toBe('UserStatusException');
        expect(exception.context?.userId).toBe(userId);
        expect(exception.context?.domain).toBe('user');
      });

      it('should create user status exception without userId', () => {
        // Arrange
        const message = 'Invalid user status transition';
        const currentStatus = 'LOCKED';
        const requestedOperation = 'unlock';

        // Act
        const exception = new UserExceptions.UserStatusException(
          message,
          currentStatus,
          requestedOperation
        );

        // Assert
        expect(exception).toBeInstanceOf(UserExceptions.UserStatusException);
        expect(exception.message).toBe(message);
        expect(exception.context?.userId).toBeUndefined();
        expect(exception.context?.domain).toBe('user');
      });
    });

    describe('UserValidationException', () => {
      it('should create user validation exception with valid data', () => {
        // Arrange
        const message = 'Invalid email format';
        const fieldName = 'email';
        const fieldValue = 'invalid-email';
        const userId = EntityId.generate().toString();

        // Act
        const exception = new UserExceptions.UserValidationException(
          message,
          fieldName,
          fieldValue,
          userId
        );

        // Assert
        expect(exception).toBeInstanceOf(UserExceptions.UserValidationException);
        expect(exception.message).toBe(message);
        expect(exception.name).toBe('UserValidationException');
        expect(exception.context?.userId).toBe(userId);
        expect(exception.context?.domain).toBe('user');
      });

      it('should create user validation exception without userId', () => {
        // Arrange
        const message = 'Password is too weak';
        const fieldName = 'password';
        const fieldValue = '123';

        // Act
        const exception = new UserExceptions.UserValidationException(
          message,
          fieldName,
          fieldValue
        );

        // Assert
        expect(exception).toBeInstanceOf(UserExceptions.UserValidationException);
        expect(exception.message).toBe(message);
        expect(exception.context?.userId).toBeUndefined();
        expect(exception.context?.domain).toBe('user');
      });
    });

    describe('UserPermissionException', () => {
      it('should create user permission exception with valid data', () => {
        // Arrange
        const message = 'User does not have required permission';
        const requiredPermission = 'user.delete';
        const resource = 'user:123';
        const userId = EntityId.generate().toString();

        // Act
        const exception = new UserExceptions.UserPermissionException(
          message,
          requiredPermission,
          resource,
          userId
        );

        // Assert
        expect(exception).toBeInstanceOf(UserExceptions.UserPermissionException);
        expect(exception.message).toBe(message);
        expect(exception.name).toBe('UserPermissionException');
        expect(exception.context?.userId).toBe(userId);
        expect(exception.context?.domain).toBe('user');
      });

      it('should create user permission exception without userId', () => {
        // Arrange
        const message = 'Insufficient permissions for operation';
        const requiredPermission = 'tenant.manage';
        const resource = 'tenant:456';

        // Act
        const exception = new UserExceptions.UserPermissionException(
          message,
          requiredPermission,
          resource
        );

        // Assert
        expect(exception).toBeInstanceOf(UserExceptions.UserPermissionException);
        expect(exception.message).toBe(message);
        expect(exception.context?.userId).toBeUndefined();
        expect(exception.context?.domain).toBe('user');
      });
    });
  });

  describe('TenantExceptions', () => {
    describe('TenantStatusException', () => {
      it('should create tenant status exception with valid data', () => {
        // Arrange
        const message = 'Tenant is not in active status';
        const currentStatus = 'SUSPENDED';
        const requestedOperation = 'activate';
        const tenantId = EntityId.generate().toString();

        // Act
        const exception = new TenantExceptions.TenantStatusException(
          message,
          currentStatus,
          requestedOperation,
          tenantId
        );

        // Assert
        expect(exception).toBeInstanceOf(TenantExceptions.TenantStatusException);
        expect(exception.message).toBe(message);
        expect(exception.name).toBe('TenantStatusException');
        expect(exception.context?.tenantId).toBe(tenantId);
        expect(exception.context?.domain).toBe('tenant');
      });

      it('should create tenant status exception without tenantId', () => {
        // Arrange
        const message = 'Invalid tenant status transition';
        const currentStatus = 'DISABLED';
        const requestedOperation = 'enable';

        // Act
        const exception = new TenantExceptions.TenantStatusException(
          message,
          currentStatus,
          requestedOperation
        );

        // Assert
        expect(exception).toBeInstanceOf(TenantExceptions.TenantStatusException);
        expect(exception.message).toBe(message);
        expect(exception.context?.tenantId).toBeUndefined();
        expect(exception.context?.domain).toBe('tenant');
      });
    });

    describe('TenantConfigException', () => {
      it('should create tenant config exception with valid data', () => {
        // Arrange
        const message = 'Invalid tenant configuration';
        const configField = 'features';
        const configValue = ['invalid_feature'];
        const tenantId = EntityId.generate().toString();

        // Act
        const exception = new TenantExceptions.TenantConfigException(
          message,
          configField,
          configValue,
          tenantId
        );

        // Assert
        expect(exception).toBeInstanceOf(TenantExceptions.TenantConfigException);
        expect(exception.message).toBe(message);
        expect(exception.name).toBe('TenantConfigException');
        expect(exception.context?.tenantId).toBe(tenantId);
        expect(exception.context?.domain).toBe('tenant');
      });
    });

    describe('TenantResourceException', () => {
      it('should create tenant resource exception with valid data', () => {
        // Arrange
        const message = 'Tenant resource limit exceeded';
        const resourceType = 'maxUsers';
        const currentUsage = 100;
        const limit = 50;
        const tenantId = EntityId.generate().toString();

        // Act
        const exception = new TenantExceptions.TenantResourceException(
          message,
          resourceType,
          currentUsage,
          limit,
          tenantId
        );

        // Assert
        expect(exception).toBeInstanceOf(TenantExceptions.TenantResourceException);
        expect(exception.message).toBe(message);
        expect(exception.name).toBe('TenantResourceException');
        expect(exception.context?.tenantId).toBe(tenantId);
        expect(exception.context?.domain).toBe('tenant');
      });
    });
  });

  describe('AuthorizationExceptions', () => {
    describe('RoleException', () => {
      it('should create role exception with valid data', () => {
        // Arrange
        const message = 'Role not found';
        const roleName = 'admin';
        const operation = 'assign';

        // Act
        const exception = new AuthorizationExceptions.RoleException(
          message,
          roleName,
          operation
        );

        // Assert
        expect(exception).toBeInstanceOf(AuthorizationExceptions.RoleException);
        expect(exception.message).toBe(message);
        expect(exception.name).toBe('RoleException');
        expect(exception.context?.domain).toBe('authorization');
      });
    });

    describe('PermissionException', () => {
      it('should create permission exception with valid data', () => {
        // Arrange
        const message = 'Permission denied';
        const permission = 'user.delete';
        const resource = 'user:123';
        const userId = EntityId.generate().toString();

        // Act
        const exception = new AuthorizationExceptions.PermissionException(
          message,
          permission,
          resource,
          userId
        );

        // Assert
        expect(exception).toBeInstanceOf(AuthorizationExceptions.PermissionException);
        expect(exception.message).toBe(message);
        expect(exception.name).toBe('PermissionException');
        expect(exception.context?.userId).toBe(userId);
        expect(exception.context?.domain).toBe('authorization');
      });
    });

    describe('UserRoleException', () => {
      it('should create user role exception with valid data', () => {
        // Arrange
        const message = 'User role assignment failed';
        const userId = EntityId.generate().toString();
        const roleName = 'admin';
        const operation = 'assign';

        // Act
        const exception = new AuthorizationExceptions.UserRoleException(
          message,
          userId,
          roleName,
          operation
        );

        // Assert
        expect(exception).toBeInstanceOf(AuthorizationExceptions.UserRoleException);
        expect(exception.message).toBe(message);
        expect(exception.name).toBe('UserRoleException');
        expect(exception.context?.userId).toBe(userId);
        expect(exception.context?.domain).toBe('authorization');
      });
    });
  });

  describe('OrganizationExceptions', () => {
    describe('OrganizationException', () => {
      it('should create organization exception with valid data', () => {
        // Arrange
        const message = 'Organization not found';
        const organizationId = EntityId.generate().toString();
        const operation = 'delete';

        // Act
        const exception = new OrganizationExceptions.OrganizationException(
          message,
          organizationId,
          operation
        );

        // Assert
        expect(exception).toBeInstanceOf(OrganizationExceptions.OrganizationException);
        expect(exception.message).toBe(message);
        expect(exception.name).toBe('OrganizationException');
        expect(exception.context?.organizationId).toBe(organizationId);
        expect(exception.context?.domain).toBe('organization');
      });
    });

    describe('DepartmentException', () => {
      it('should create department exception with valid data', () => {
        // Arrange
        const message = 'Department hierarchy violation';
        const departmentId = EntityId.generate().toString();
        const parentDepartmentId = EntityId.generate().toString();

        // Act
        const exception = new OrganizationExceptions.DepartmentException(
          message,
          departmentId,
          parentDepartmentId
        );

        // Assert
        expect(exception).toBeInstanceOf(OrganizationExceptions.DepartmentException);
        expect(exception.message).toBe(message);
        expect(exception.name).toBe('DepartmentException');
        expect(exception.context?.departmentId).toBe(departmentId);
        expect(exception.context?.domain).toBe('organization');
      });
    });

    describe('HierarchyException', () => {
      it('should create hierarchy exception with valid data', () => {
        // Arrange
        const message = 'Invalid organization hierarchy';
        const organizationId = EntityId.generate().toString();
        const departmentId = EntityId.generate().toString();

        // Act
        const exception = new OrganizationExceptions.HierarchyException(
          message,
          organizationId,
          departmentId
        );

        // Assert
        expect(exception).toBeInstanceOf(OrganizationExceptions.HierarchyException);
        expect(exception.message).toBe(message);
        expect(exception.name).toBe('HierarchyException');
        expect(exception.context?.organizationId).toBe(organizationId);
        expect(exception.context?.domain).toBe('organization');
      });
    });
  });

  describe('Exception Inheritance', () => {
    it('should inherit from appropriate base exception types', () => {
      // Arrange & Act
      const userStatusException = new UserExceptions.UserStatusException(
        'test', 'ACTIVE', 'activate'
      );
      const userValidationException = new UserExceptions.UserValidationException(
        'test', 'email', 'invalid'
      );
      const userPermissionException = new UserExceptions.UserPermissionException(
        'test', 'permission', 'resource'
      );

      // Assert
      expect(userStatusException).toBeInstanceOf(UserExceptions.UserStatusException);
      expect(userValidationException).toBeInstanceOf(UserExceptions.UserValidationException);
      expect(userPermissionException).toBeInstanceOf(UserExceptions.UserPermissionException);
    });
  });

  describe('Exception Context', () => {
    it('should maintain correct domain context', () => {
      // Arrange & Act
      const userException = new UserExceptions.UserStatusException(
        'test', 'ACTIVE', 'activate'
      );
      const tenantException = new TenantExceptions.TenantStatusException(
        'test', 'ACTIVE', 'activate'
      );
      const authException = new AuthorizationExceptions.RoleException(
        'test', 'admin', 'assign'
      );
      const orgException = new OrganizationExceptions.OrganizationException(
        'test', 'org-123', 'delete'
      );

      // Assert
      expect(userException.context?.domain).toBe('user');
      expect(tenantException.context?.domain).toBe('tenant');
      expect(authException.context?.domain).toBe('authorization');
      expect(orgException.context?.domain).toBe('organization');
    });

    it('should maintain entity IDs in context', () => {
      // Arrange
      const userId = EntityId.generate().toString();
      const tenantId = EntityId.generate().toString();
      const orgId = EntityId.generate().toString();
      const deptId = EntityId.generate().toString();

      // Act
      const userException = new UserExceptions.UserStatusException(
        'test', 'ACTIVE', 'activate', userId
      );
      const tenantException = new TenantExceptions.TenantStatusException(
        'test', 'ACTIVE', 'activate', tenantId
      );
      const orgException = new OrganizationExceptions.OrganizationException(
        'test', orgId, 'delete'
      );
      const deptException = new OrganizationExceptions.DepartmentException(
        'test', deptId, 'parent-123'
      );

      // Assert
      expect(userException.context?.userId).toBe(userId);
      expect(tenantException.context?.tenantId).toBe(tenantId);
      expect(orgException.context?.organizationId).toBe(orgId);
      expect(deptException.context?.departmentId).toBe(deptId);
    });
  });

  describe('Exception Messages', () => {
    it('should preserve custom exception messages', () => {
      // Arrange
      const customMessages = [
        'Custom user status message',
        'Custom tenant config message',
        'Custom permission message',
        'Custom organization message'
      ];

      // Act
      const userException = new UserExceptions.UserStatusException(
        customMessages[0], 'ACTIVE', 'activate'
      );
      const tenantException = new TenantExceptions.TenantConfigException(
        customMessages[1], 'features', []
      );
      const authException = new AuthorizationExceptions.PermissionException(
        customMessages[2], 'permission', 'resource'
      );
      const orgException = new OrganizationExceptions.OrganizationException(
        customMessages[3], 'org-123', 'delete'
      );

      // Assert
      expect(userException.message).toBe(customMessages[0]);
      expect(tenantException.message).toBe(customMessages[1]);
      expect(authException.message).toBe(customMessages[2]);
      expect(orgException.message).toBe(customMessages[3]);
    });
  });

  describe('Exception Stack Traces', () => {
    it('should maintain proper stack traces', () => {
      // Arrange & Act
      const userException = new UserExceptions.UserStatusException(
        'test', 'ACTIVE', 'activate'
      );

      // Assert
      expect(userException.stack).toBeDefined();
      expect(userException.stack).toContain('UserStatusException');
    });
  });
});
