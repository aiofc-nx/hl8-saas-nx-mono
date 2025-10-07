/**
 * 租户实体单元测试
 * 
 * @description 测试租户实体的业务逻辑和状态管理
 * 
 * @since 1.0.0
 */

import { Tenant } from './tenant.entity';
import { EntityId } from '@hl8/hybrid-archi';
import { TENANT_TYPES, TENANT_STATUS } from '../../../constants/business.constants';
import { TenantConfig } from '../value-objects/tenant-config.vo';
import { ResourceLimits } from '../value-objects/resource-limits.vo';
import { TenantCode } from '../value-objects/tenant-code.vo';
import { 
  TenantNotPendingException, 
  TenantNotActiveException, 
  InvalidFeatureException 
} from './tenant.entity';

describe('Tenant Entity', () => {
  let tenant: Tenant;
  let tenantId: EntityId;
  let config: TenantConfig;
  let resourceLimits: ResourceLimits;

  beforeEach(() => {
    tenantId = EntityId.generate();
    config = TenantConfig.create({
      features: ['user_management', 'organization'],
      theme: 'default',
      branding: {},
      settings: {}
    });
    resourceLimits = ResourceLimits.create({
      maxUsers: 100,
      maxOrganizations: 5,
      maxStorage: 1024,
      maxApiCalls: 10000
    });

    tenant = new Tenant(
      tenantId,
      TenantCode.generate(),
      'Test Tenant',
      TENANT_TYPES.BASIC,
      TENANT_STATUS.PENDING,
      'admin-id',
      config,
      resourceLimits
    );
  });

  describe('activate', () => {
    it('should activate tenant when status is PENDING', () => {
      // Arrange
      expect(tenant.status).toBe(TENANT_STATUS.PENDING);

      // Act
      tenant.activate();

      // Assert
      expect(tenant.status).toBe(TENANT_STATUS.ACTIVE);
    });

    it('should throw error when trying to activate non-pending tenant', () => {
      // Arrange
      tenant.activate(); // 先激活
      expect(tenant.status).toBe(TENANT_STATUS.ACTIVE);

      // Act & Assert
      expect(() => tenant.activate()).toThrow(TenantNotPendingException);
    });
  });

  describe('suspend', () => {
    it('should suspend tenant when status is ACTIVE', () => {
      // Arrange
      tenant.activate();
      expect(tenant.status).toBe(TENANT_STATUS.ACTIVE);

      // Act
      tenant.suspend('Maintenance');

      // Assert
      expect(tenant.status).toBe(TENANT_STATUS.SUSPENDED);
    });

    it('should throw error when trying to suspend non-active tenant', () => {
      // Arrange
      expect(tenant.status).toBe(TENANT_STATUS.PENDING);

      // Act & Assert
      expect(() => tenant.suspend('Test')).toThrow(TenantNotActiveException);
    });
  });

  describe('canUseFeature', () => {
    it('should return true for allowed feature', () => {
      // Act & Assert
      expect(tenant.canUseFeature('user_management')).toBe(true);
    });

    it('should return false for disallowed feature', () => {
      // Act & Assert
      expect(tenant.canUseFeature('advanced_analytics')).toBe(false);
    });

    it('should return true for all_features', () => {
      // Arrange
      const enterpriseConfig = { ...config, features: ['all_features'] };
      const enterpriseTenant = new Tenant(
        tenantId,
        TenantCode.generate(),
        'Enterprise Tenant',
        TENANT_TYPES.ENTERPRISE,
        TENANT_STATUS.ACTIVE,
        'admin-id',
        enterpriseConfig,
        resourceLimits
      );

      // Act & Assert
      expect(enterpriseTenant.canUseFeature('any_feature')).toBe(true);
    });
  });

  describe('isResourceLimitExceeded', () => {
    it('should return true when usage exceeds limit', () => {
      // Act & Assert
      expect(tenant.isResourceLimitExceeded('maxUsers', 150)).toBe(true);
    });

    it('should return false when usage is within limit', () => {
      // Act & Assert
      expect(tenant.isResourceLimitExceeded('maxUsers', 50)).toBe(false);
    });

    it('should return false for unlimited resource', () => {
      // Arrange
      const unlimitedLimits = { ...resourceLimits, maxUsers: -1 };
      const unlimitedTenant = new Tenant(
        tenantId,
        TenantCode.generate(),
        'Unlimited Tenant',
        TENANT_TYPES.ENTERPRISE,
        TENANT_STATUS.ACTIVE,
        'admin-id',
        config,
        unlimitedLimits
      );

      // Act & Assert
      expect(unlimitedTenant.isResourceLimitExceeded('maxUsers', 10000)).toBe(false);
    });
  });

  describe('updateConfig', () => {
    it('should update config with valid features', () => {
      // Arrange
      const newConfig = {
        features: ['user_management', 'organization', 'department']
      };

      // Act
      tenant.updateConfig(newConfig);

      // Assert
      expect(tenant.config.features).toEqual(['user_management', 'organization', 'department']);
    });

    it('should throw error for invalid features', () => {
      // Arrange
      const invalidConfig = {
        features: ['invalid_feature']
      };

      // Act & Assert
      expect(() => tenant.updateConfig(invalidConfig)).toThrow(InvalidFeatureException);
    });
  });

  describe('getters', () => {
    it('should return correct property values', () => {
      // Assert
      expect(tenant.code).toBe('test-tenant');
      expect(tenant.name).toBe('Test Tenant');
      expect(tenant.type).toBe(TENANT_TYPES.BASIC);
      expect(tenant.status).toBe(TENANT_STATUS.PENDING);
      expect(tenant.adminId).toBe('admin-id');
      expect(tenant.config).toEqual(config);
      expect(tenant.resourceLimits).toEqual(resourceLimits);
    });
  });
});
