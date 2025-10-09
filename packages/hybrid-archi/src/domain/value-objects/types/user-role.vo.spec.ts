/**
 * UserRole枚举和工具类单元测试
 *
 * @description 测试UserRole枚举和UserRoleUtils工具类的功能
 * @since 1.0.0
 */

import { UserRole, UserRoleUtils } from './user-role.vo';

describe('UserRole枚举', () => {
  describe('枚举值', () => {
    it('应该定义所有角色类型', () => {
      // Assert
      expect(UserRole.PLATFORM_ADMIN).toBe('PLATFORM_ADMIN');
      expect(UserRole.TENANT_ADMIN).toBe('TENANT_ADMIN');
      expect(UserRole.ORGANIZATION_ADMIN).toBe('ORGANIZATION_ADMIN');
      expect(UserRole.DEPARTMENT_ADMIN).toBe('DEPARTMENT_ADMIN');
      expect(UserRole.REGULAR_USER).toBe('REGULAR_USER');
      expect(UserRole.GUEST_USER).toBe('GUEST_USER');
    });

    it('应该包含6种角色类型', () => {
      // Act
      const roles = Object.values(UserRole);

      // Assert
      expect(roles).toHaveLength(6);
    });
  });
});

describe('UserRoleUtils工具类', () => {
  describe('hasPermission', () => {
    it('应该验证平台管理员拥有平台管理权限', () => {
      // Act
      const result = UserRoleUtils.hasPermission(
        UserRole.PLATFORM_ADMIN,
        'manage_platform'
      );

      // Assert
      expect(result).toBe(true);
    });

    it('应该验证租户管理员拥有租户管理权限', () => {
      // Act
      const result = UserRoleUtils.hasPermission(
        UserRole.TENANT_ADMIN,
        'manage_tenant'
      );

      // Assert
      expect(result).toBe(true);
    });

    it('应该验证普通用户没有管理权限', () => {
      // Act
      const result = UserRoleUtils.hasPermission(
        UserRole.REGULAR_USER,
        'manage_tenant'
      );

      // Assert
      expect(result).toBe(false);
    });

    it('应该验证访客用户只有查看权限', () => {
      // Act
      const hasViewPermission = UserRoleUtils.hasPermission(
        UserRole.GUEST_USER,
        'view_public_info'
      );
      const hasManagePermission = UserRoleUtils.hasPermission(
        UserRole.GUEST_USER,
        'manage_tenant'
      );

      // Assert
      expect(hasViewPermission).toBe(true);
      expect(hasManagePermission).toBe(false);
    });

    it('应该验证组织管理员拥有组织管理权限', () => {
      // Act
      const result = UserRoleUtils.hasPermission(
        UserRole.ORGANIZATION_ADMIN,
        'manage_organization'
      );

      // Assert
      expect(result).toBe(true);
    });

    it('应该验证部门管理员拥有部门管理权限', () => {
      // Act
      const result = UserRoleUtils.hasPermission(
        UserRole.DEPARTMENT_ADMIN,
        'manage_department'
      );

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('canManage', () => {
    it('应该验证平台管理员可以管理所有角色', () => {
      // Act & Assert
      expect(
        UserRoleUtils.canManage(UserRole.PLATFORM_ADMIN, UserRole.TENANT_ADMIN)
      ).toBe(true);
      expect(
        UserRoleUtils.canManage(
          UserRole.PLATFORM_ADMIN,
          UserRole.ORGANIZATION_ADMIN
        )
      ).toBe(true);
      expect(
        UserRoleUtils.canManage(
          UserRole.PLATFORM_ADMIN,
          UserRole.DEPARTMENT_ADMIN
        )
      ).toBe(true);
      expect(
        UserRoleUtils.canManage(UserRole.PLATFORM_ADMIN, UserRole.REGULAR_USER)
      ).toBe(true);
      expect(
        UserRoleUtils.canManage(UserRole.PLATFORM_ADMIN, UserRole.GUEST_USER)
      ).toBe(true);
    });

    it('应该验证租户管理员可以管理租户内角色', () => {
      // Act & Assert
      expect(
        UserRoleUtils.canManage(
          UserRole.TENANT_ADMIN,
          UserRole.ORGANIZATION_ADMIN
        )
      ).toBe(true);
      expect(
        UserRoleUtils.canManage(
          UserRole.TENANT_ADMIN,
          UserRole.DEPARTMENT_ADMIN
        )
      ).toBe(true);
      expect(
        UserRoleUtils.canManage(UserRole.TENANT_ADMIN, UserRole.REGULAR_USER)
      ).toBe(true);
      expect(
        UserRoleUtils.canManage(UserRole.TENANT_ADMIN, UserRole.GUEST_USER)
      ).toBe(true);
    });

    it('应该验证租户管理员不能管理平台管理员', () => {
      // Act
      const result = UserRoleUtils.canManage(
        UserRole.TENANT_ADMIN,
        UserRole.PLATFORM_ADMIN
      );

      // Assert
      expect(result).toBe(false);
    });

    it('应该验证组织管理员可以管理部门和普通用户', () => {
      // Act & Assert
      expect(
        UserRoleUtils.canManage(
          UserRole.ORGANIZATION_ADMIN,
          UserRole.DEPARTMENT_ADMIN
        )
      ).toBe(true);
      expect(
        UserRoleUtils.canManage(
          UserRole.ORGANIZATION_ADMIN,
          UserRole.REGULAR_USER
        )
      ).toBe(true);
      expect(
        UserRoleUtils.canManage(
          UserRole.ORGANIZATION_ADMIN,
          UserRole.GUEST_USER
        )
      ).toBe(true);
    });

    it('应该验证部门管理员可以管理普通用户', () => {
      // Act
      const result = UserRoleUtils.canManage(
        UserRole.DEPARTMENT_ADMIN,
        UserRole.REGULAR_USER
      );

      // Assert
      expect(result).toBe(true);
    });

    it('应该验证普通用户可以管理访客用户', () => {
      // Act
      const canManageGuest = UserRoleUtils.canManage(
        UserRole.REGULAR_USER,
        UserRole.GUEST_USER
      );
      const canManageDept = UserRoleUtils.canManage(
        UserRole.REGULAR_USER,
        UserRole.DEPARTMENT_ADMIN
      );

      // Assert
      // REGULAR_USER层级(20) > GUEST_USER层级(10)，所以可以管理
      expect(canManageGuest).toBe(true);
      // REGULAR_USER层级(20) < DEPARTMENT_ADMIN层级(40)，所以不能管理
      expect(canManageDept).toBe(false);
    });

    it('应该验证访客用户不能管理任何角色', () => {
      // Act & Assert
      expect(
        UserRoleUtils.canManage(UserRole.GUEST_USER, UserRole.REGULAR_USER)
      ).toBe(false);
      expect(
        UserRoleUtils.canManage(UserRole.GUEST_USER, UserRole.GUEST_USER)
      ).toBe(false);
    });
  });

  describe('getPermissions', () => {
    it('应该返回平台管理员的权限列表', () => {
      // Act
      const permissions = UserRoleUtils.getPermissions(UserRole.PLATFORM_ADMIN);

      // Assert
      expect(permissions).toContain('manage_platform');
      expect(permissions).toContain('manage_all_tenants');
      expect(permissions).toContain('manage_all_users');
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('应该返回租户管理员的权限列表', () => {
      // Act
      const permissions = UserRoleUtils.getPermissions(UserRole.TENANT_ADMIN);

      // Assert
      expect(permissions).toContain('manage_tenant');
      expect(permissions).toContain('manage_tenant_users');
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('应该返回普通用户的权限列表', () => {
      // Act
      const permissions = UserRoleUtils.getPermissions(UserRole.REGULAR_USER);

      // Assert
      expect(permissions).toContain('view_own_profile');
      expect(permissions).toContain('update_own_profile');
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('应该返回权限的副本而不是原始数组', () => {
      // Act
      const permissions1 = UserRoleUtils.getPermissions(UserRole.TENANT_ADMIN);
      const permissions2 = UserRoleUtils.getPermissions(UserRole.TENANT_ADMIN);

      // Assert
      expect(permissions1).not.toBe(permissions2);
      expect(permissions1).toEqual(permissions2);
    });
  });

  describe('getDescription', () => {
    it('应该返回平台管理员的中文描述', () => {
      // Act
      const description = UserRoleUtils.getDescription(UserRole.PLATFORM_ADMIN);

      // Assert
      expect(description).toBe('平台管理员');
    });

    it('应该返回租户管理员的中文描述', () => {
      // Act
      const description = UserRoleUtils.getDescription(UserRole.TENANT_ADMIN);

      // Assert
      expect(description).toBe('租户管理员');
    });

    it('应该返回组织管理员的中文描述', () => {
      // Act
      const description = UserRoleUtils.getDescription(
        UserRole.ORGANIZATION_ADMIN
      );

      // Assert
      expect(description).toBe('组织管理员');
    });

    it('应该返回部门管理员的中文描述', () => {
      // Act
      const description = UserRoleUtils.getDescription(
        UserRole.DEPARTMENT_ADMIN
      );

      // Assert
      expect(description).toBe('部门管理员');
    });

    it('应该返回普通用户的中文描述', () => {
      // Act
      const description = UserRoleUtils.getDescription(UserRole.REGULAR_USER);

      // Assert
      expect(description).toBe('普通用户');
    });

    it('应该返回访客用户的中文描述', () => {
      // Act
      const description = UserRoleUtils.getDescription(UserRole.GUEST_USER);

      // Assert
      expect(description).toBe('访客用户');
    });
  });

  describe('getLevel', () => {
    it('应该返回正确的角色层级', () => {
      // Act & Assert
      expect(UserRoleUtils.getLevel(UserRole.PLATFORM_ADMIN)).toBe(100);
      expect(UserRoleUtils.getLevel(UserRole.TENANT_ADMIN)).toBe(80);
      expect(UserRoleUtils.getLevel(UserRole.ORGANIZATION_ADMIN)).toBe(60);
      expect(UserRoleUtils.getLevel(UserRole.DEPARTMENT_ADMIN)).toBe(40);
      expect(UserRoleUtils.getLevel(UserRole.REGULAR_USER)).toBe(20);
      expect(UserRoleUtils.getLevel(UserRole.GUEST_USER)).toBe(10);
    });

    it('应该验证角色层级顺序正确', () => {
      // Act
      const platformLevel = UserRoleUtils.getLevel(UserRole.PLATFORM_ADMIN);
      const tenantLevel = UserRoleUtils.getLevel(UserRole.TENANT_ADMIN);
      const orgLevel = UserRoleUtils.getLevel(UserRole.ORGANIZATION_ADMIN);
      const deptLevel = UserRoleUtils.getLevel(UserRole.DEPARTMENT_ADMIN);
      const regularLevel = UserRoleUtils.getLevel(UserRole.REGULAR_USER);
      const guestLevel = UserRoleUtils.getLevel(UserRole.GUEST_USER);

      // Assert
      expect(platformLevel).toBeGreaterThan(tenantLevel);
      expect(tenantLevel).toBeGreaterThan(orgLevel);
      expect(orgLevel).toBeGreaterThan(deptLevel);
      expect(deptLevel).toBeGreaterThan(regularLevel);
      expect(regularLevel).toBeGreaterThan(guestLevel);
    });
  });

  describe('isAdmin', () => {
    it('应该识别平台管理员为管理员角色', () => {
      // Act
      const result = UserRoleUtils.isAdmin(UserRole.PLATFORM_ADMIN);

      // Assert
      expect(result).toBe(true);
    });

    it('应该识别租户管理员为管理员角色', () => {
      // Act
      const result = UserRoleUtils.isAdmin(UserRole.TENANT_ADMIN);

      // Assert
      expect(result).toBe(true);
    });

    it('应该识别组织管理员为管理员角色', () => {
      // Act
      const result = UserRoleUtils.isAdmin(UserRole.ORGANIZATION_ADMIN);

      // Assert
      expect(result).toBe(true);
    });

    it('应该识别部门管理员为管理员角色', () => {
      // Act
      const result = UserRoleUtils.isAdmin(UserRole.DEPARTMENT_ADMIN);

      // Assert
      expect(result).toBe(true);
    });

    it('应该识别普通用户不是管理员角色', () => {
      // Act
      const result = UserRoleUtils.isAdmin(UserRole.REGULAR_USER);

      // Assert
      expect(result).toBe(false);
    });

    it('应该识别访客用户不是管理员角色', () => {
      // Act
      const result = UserRoleUtils.isAdmin(UserRole.GUEST_USER);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isPlatformRole', () => {
    it('应该识别平台管理员为平台级角色', () => {
      // Act
      const result = UserRoleUtils.isPlatformRole(UserRole.PLATFORM_ADMIN);

      // Assert
      expect(result).toBe(true);
    });

    it('应该识别其他角色不是平台级角色', () => {
      // Act & Assert
      expect(UserRoleUtils.isPlatformRole(UserRole.TENANT_ADMIN)).toBe(false);
      expect(UserRoleUtils.isPlatformRole(UserRole.ORGANIZATION_ADMIN)).toBe(
        false
      );
      expect(UserRoleUtils.isPlatformRole(UserRole.DEPARTMENT_ADMIN)).toBe(
        false
      );
      expect(UserRoleUtils.isPlatformRole(UserRole.REGULAR_USER)).toBe(false);
      expect(UserRoleUtils.isPlatformRole(UserRole.GUEST_USER)).toBe(false);
    });
  });

  describe('isTenantRole', () => {
    it('应该识别租户管理员为租户级角色', () => {
      // Act
      const result = UserRoleUtils.isTenantRole(UserRole.TENANT_ADMIN);

      // Assert
      expect(result).toBe(true);
    });

    it('应该识别组织管理员为租户级角色', () => {
      // Act
      const result = UserRoleUtils.isTenantRole(UserRole.ORGANIZATION_ADMIN);

      // Assert
      expect(result).toBe(true);
    });

    it('应该识别部门管理员为租户级角色', () => {
      // Act
      const result = UserRoleUtils.isTenantRole(UserRole.DEPARTMENT_ADMIN);

      // Assert
      expect(result).toBe(true);
    });

    it('应该识别普通用户为租户级角色', () => {
      // Act
      const result = UserRoleUtils.isTenantRole(UserRole.REGULAR_USER);

      // Assert
      expect(result).toBe(true);
    });

    it('应该识别平台管理员不是租户级角色', () => {
      // Act
      const result = UserRoleUtils.isTenantRole(UserRole.PLATFORM_ADMIN);

      // Assert
      expect(result).toBe(false);
    });

    it('应该识别访客用户不是租户级角色', () => {
      // Act
      const result = UserRoleUtils.isTenantRole(UserRole.GUEST_USER);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getAdminRoles', () => {
    it('应该返回所有管理员角色', () => {
      // Act
      const adminRoles = UserRoleUtils.getAdminRoles();

      // Assert
      expect(adminRoles).toContain(UserRole.PLATFORM_ADMIN);
      expect(adminRoles).toContain(UserRole.TENANT_ADMIN);
      expect(adminRoles).toContain(UserRole.ORGANIZATION_ADMIN);
      expect(adminRoles).toContain(UserRole.DEPARTMENT_ADMIN);
      expect(adminRoles).toHaveLength(4);
    });

    it('应该不包含普通用户和访客用户', () => {
      // Act
      const adminRoles = UserRoleUtils.getAdminRoles();

      // Assert
      expect(adminRoles).not.toContain(UserRole.REGULAR_USER);
      expect(adminRoles).not.toContain(UserRole.GUEST_USER);
    });
  });
});

