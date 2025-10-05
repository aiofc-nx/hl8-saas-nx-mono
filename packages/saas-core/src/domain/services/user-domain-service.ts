/**
 * 用户领域服务
 * 
 * @description 处理用户相关的跨聚合业务逻辑
 * 负责用户唯一性验证、权限检查、租户关联等复杂业务规则
 * 
 * @since 1.0.0
 */

import { UserId, TenantId, Email, Username } from '@hl8/hybrid-archi';
import { UserRole } from '../user/entities/user.entity';

/**
 * 用户仓储接口
 * 
 * @description 定义用户数据访问接口
 */
export interface IUserRepository {
  findByEmail(email: Email, tenantId?: TenantId): Promise<any>;
  findByUsername(username: Username, tenantId?: TenantId): Promise<any>;
  findByEmailAndTenant(email: Email, tenantId: TenantId): Promise<any>;
  findByUsernameAndTenant(username: Username, tenantId: TenantId): Promise<any>;
  countByTenant(tenantId: TenantId): Promise<number>;
  countByRole(role: UserRole, tenantId?: TenantId): Promise<number>;
}

/**
 * 用户领域服务
 * 
 * @description 处理用户相关的复杂业务逻辑
 */
export class UserDomainService {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * 验证用户邮箱唯一性
   * 
   * @param email 用户邮箱
   * @param tenantId 租户ID（可选）
   * @returns true如果邮箱唯一，否则false
   */
  public async validateEmailUniqueness(email: Email, tenantId?: TenantId): Promise<boolean> {
    const existingUser = tenantId 
      ? await this.userRepository.findByEmailAndTenant(email, tenantId)
      : await this.userRepository.findByEmail(email);
    
    return existingUser === null;
  }

  /**
   * 验证用户名唯一性
   * 
   * @param username 用户名
   * @param tenantId 租户ID（可选）
   * @returns true如果用户名唯一，否则false
   */
  public async validateUsernameUniqueness(username: Username, tenantId?: TenantId): Promise<boolean> {
    const existingUser = tenantId 
      ? await this.userRepository.findByUsernameAndTenant(username, tenantId)
      : await this.userRepository.findByUsername(username);
    
    return existingUser === null;
  }

  /**
   * 验证租户用户数量限制
   * 
   * @param tenantId 租户ID
   * @param maxUsers 最大用户数限制
   * @returns true如果未超出限制，否则false
   */
  public async validateTenantUserLimit(tenantId: TenantId, maxUsers: number): Promise<boolean> {
    if (maxUsers === -1) return true; // 无限制
    
    const currentCount = await this.userRepository.countByTenant(tenantId);
    return currentCount < maxUsers;
  }

  /**
   * 验证租户管理员数量限制
   * 
   * @param tenantId 租户ID
   * @param maxAdmins 最大管理员数限制
   * @returns true如果未超出限制，否则false
   */
  public async validateTenantAdminLimit(tenantId: TenantId, maxAdmins: number): Promise<boolean> {
    if (maxAdmins === -1) return true; // 无限制
    
    const currentCount = await this.userRepository.countByRole(UserRole.TENANT_ADMIN, tenantId);
    return currentCount < maxAdmins;
  }

  /**
   * 验证用户是否可以分配到租户
   * 
   * @param userId 用户ID
   * @param tenantId 租户ID
   * @param maxUsers 租户最大用户数限制
   * @returns true如果可以分配，否则false
   */
  public async canAssignUserToTenant(userId: UserId, tenantId: TenantId, maxUsers: number): Promise<boolean> {
    // 检查租户用户数量限制
    const withinLimit = await this.validateTenantUserLimit(tenantId, maxUsers);
    if (!withinLimit) return false;
    
    // 可以添加更多验证逻辑，如用户状态检查等
    return true;
  }

  /**
   * 验证用户角色分配权限
   * 
   * @param currentUserRole 当前用户角色
   * @param targetRole 目标角色
   * @returns true如果可以分配，否则false
   */
  public validateRoleAssignmentPermission(currentUserRole: UserRole, targetRole: UserRole): boolean {
    // 只有更高级别的管理员可以分配角色
    const roleHierarchy: Record<UserRole, UserRole[]> = {
      [UserRole.PLATFORM_ADMIN]: [UserRole.PLATFORM_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.DEPARTMENT_ADMIN, UserRole.REGULAR_USER],
      [UserRole.TENANT_ADMIN]: [UserRole.ORGANIZATION_ADMIN, UserRole.DEPARTMENT_ADMIN, UserRole.REGULAR_USER],
      [UserRole.ORGANIZATION_ADMIN]: [UserRole.DEPARTMENT_ADMIN, UserRole.REGULAR_USER],
      [UserRole.DEPARTMENT_ADMIN]: [UserRole.REGULAR_USER],
      [UserRole.REGULAR_USER]: []
    };
    
    const allowedRoles = roleHierarchy[currentUserRole] || [];
    return allowedRoles.includes(targetRole);
  }

  /**
   * 检查用户是否具有特定权限
   * 
   * @param userRole 用户角色
   * @param permission 权限名称
   * @returns true如果具有权限，否则false
   */
  public hasPermission(userRole: UserRole, permission: string): boolean {
    const rolePermissions: Record<UserRole, string[]> = {
      [UserRole.PLATFORM_ADMIN]: ['*'], // 所有权限
      [UserRole.TENANT_ADMIN]: [
        'tenant_management',
        'organization_management',
        'department_management',
        'user_management',
        'tenant_settings',
        'tenant_analytics'
      ],
      [UserRole.ORGANIZATION_ADMIN]: [
        'organization_management',
        'department_management',
        'user_management',
        'organization_settings',
        'organization_analytics'
      ],
      [UserRole.DEPARTMENT_ADMIN]: [
        'department_management',
        'user_management',
        'department_settings',
        'department_analytics'
      ],
      [UserRole.REGULAR_USER]: [
        'profile_management',
        'basic_access'
      ]
    };
    
    const permissions = rolePermissions[userRole] || [];
    return permissions.includes('*') || permissions.includes(permission);
  }

  /**
   * 获取用户的有效权限列表
   * 
   * @param userRole 用户角色
   * @param tenantId 租户ID（用于租户特定权限）
   * @returns 权限列表
   */
  public getUserPermissions(userRole: UserRole, tenantId?: TenantId): string[] {
    const basePermissions: Record<UserRole, string[]> = {
      [UserRole.PLATFORM_ADMIN]: ['*'],
      [UserRole.TENANT_ADMIN]: [
        'tenant_management',
        'organization_management',
        'department_management',
        'user_management',
        'tenant_settings',
        'tenant_analytics'
      ],
      [UserRole.ORGANIZATION_ADMIN]: [
        'organization_management',
        'department_management',
        'user_management',
        'organization_settings',
        'organization_analytics'
      ],
      [UserRole.DEPARTMENT_ADMIN]: [
        'department_management',
        'user_management',
        'department_settings',
        'department_analytics'
      ],
      [UserRole.REGULAR_USER]: [
        'profile_management',
        'basic_access'
      ]
    };
    
    let permissions = basePermissions[userRole] || [];
    
    // 如果是租户特定用户，添加租户权限前缀
    if (tenantId && userRole !== UserRole.PLATFORM_ADMIN) {
      permissions = permissions.map(p => `tenant:${tenantId.value}:${p}`);
    }
    
    return permissions;
  }
}
