/**
 * 用户业务规则服务
 *
 * @description 纯粹的领域服务，只包含用户相关的业务规则验证
 * 继承自 hybrid-archi 的 BaseDomainService，遵循统一的架构模式
 *
 * ## 业务规则
 *
 * ### 用户标识规则
 * - 邮箱格式验证
 * - 用户名格式验证
 * - 邮箱和用户名唯一性规则
 *
 * ### 用户角色规则
 * - 角色层级关系
 * - 角色分配权限
 * - 角色转换规则
 *
 * ### 用户状态规则
 * - 状态转换矩阵
 * - 状态相关业务逻辑
 * - 状态验证规则
 *
 * @example
 * ```typescript
 * const userRules = new UserBusinessRulesService();
 * 
 * // 验证邮箱格式
 * const isValidEmail = userRules.validateEmailFormat('user@example.com');
 * 
 * // 验证角色分配权限
 * const canAssign = userRules.validateRoleAssignmentPermission(
 *   UserRole.TENANT_ADMIN,
 *   UserRole.ORGANIZATION_ADMIN
 * );
 * ```
 *
 * @since 1.0.0
 */

import { IDomainService } from '@hl8/hybrid-archi';
import { UserRole } from '@hl8/hybrid-archi';
import { UserStatus } from '@hl8/hybrid-archi';

/**
 * 用户业务规则服务
 *
 * @description 纯粹的领域服务，只包含业务规则验证逻辑
 * 继承自 hybrid-archi 的 BaseDomainService，遵循统一的架构模式
 *
 * @since 1.0.0
 */
export class UserBusinessRulesService implements IDomainService {
  /**
   * 构造函数
   *
   * @description 创建用户业务规则服务实例
   * 继承自 BaseDomainService，提供统一的服务管理能力
   *
   * @since 1.0.0
   */
  constructor() {
    // IDomainService 是接口，不需要调用 super()
  }
  /**
   * 验证邮箱格式
   *
   * @description 验证邮箱地址是否符合格式要求
   *
   * @param email - 邮箱地址
   * @returns 是否格式正确
   *
   * @example
   * ```typescript
   * const isValid = userRules.validateEmailFormat('user@example.com'); // true
   * const isInvalid = userRules.validateEmailFormat('invalid-email'); // false
   * ```
   *
   * @since 1.0.0
   */
  public validateEmailFormat(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    // 基本长度检查
    if (email.length < 5 || email.length > 254) {
      return false;
    }

    // 邮箱格式正则表达式
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  /**
   * 验证用户名格式
   *
   * @description 验证用户名是否符合格式要求
   * 格式规则：3-50字符，只能包含字母、数字、下划线和连字符
   *
   * @param username - 用户名
   * @returns 是否格式正确
   *
   * @example
   * ```typescript
   * const isValid = userRules.validateUsernameFormat('john_doe'); // true
   * const isInvalid = userRules.validateUsernameFormat('ab'); // false
   * ```
   *
   * @since 1.0.0
   */
  public validateUsernameFormat(username: string): boolean {
    if (!username || typeof username !== 'string') {
      return false;
    }

    // 长度检查
    if (username.length < 3 || username.length > 50) {
      return false;
    }

    // 格式检查：只能包含字母、数字、下划线和连字符
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    return usernameRegex.test(username);
  }

  /**
   * 验证邮箱是否已存在
   *
   * @description 检查邮箱是否已被使用
   * 注意：这个方法需要外部提供现有邮箱列表
   *
   * @param email - 邮箱地址
   * @param existingEmails - 已存在的邮箱列表
   * @returns 是否唯一
   *
   * @example
   * ```typescript
   * const existingEmails = ['user1@example.com', 'user2@example.com'];
   * const isUnique = userRules.validateEmailUniqueness('user3@example.com', existingEmails); // true
   * ```
   *
   * @since 1.0.0
   */
  public validateEmailUniqueness(email: string, existingEmails: string[]): boolean {
    if (!this.validateEmailFormat(email)) {
      return false;
    }

    return !existingEmails.includes(email.toLowerCase());
  }

  /**
   * 验证用户名是否已存在
   *
   * @description 检查用户名是否已被使用
   * 注意：这个方法需要外部提供现有用户名列表
   *
   * @param username - 用户名
   * @param existingUsernames - 已存在的用户名列表
   * @returns 是否唯一
   *
   * @example
   * ```typescript
   * const existingUsernames = ['john_doe', 'jane_smith'];
   * const isUnique = userRules.validateUsernameUniqueness('bob_wilson', existingUsernames); // true
   * ```
   *
   * @since 1.0.0
   */
  public validateUsernameUniqueness(username: string, existingUsernames: string[]): boolean {
    if (!this.validateUsernameFormat(username)) {
      return false;
    }

    return !existingUsernames.includes(username.toLowerCase());
  }

  /**
   * 验证用户数量限制
   *
   * @description 检查用户数量是否超出限制
   *
   * @param currentCount - 当前用户数量
   * @param maxCount - 最大用户数限制
   * @returns 是否在限制范围内
   *
   * @example
   * ```typescript
   * const withinLimit = userRules.validateUserCountLimit(50, 100); // true
   * const exceedsLimit = userRules.validateUserCountLimit(150, 100); // false
   * ```
   *
   * @since 1.0.0
   */
  public validateUserCountLimit(currentCount: number, maxCount: number): boolean {
    if (maxCount === -1) {
      return true; // 无限制
    }

    return currentCount < maxCount;
  }

  /**
   * 验证管理员数量限制
   *
   * @description 检查管理员数量是否超出限制
   *
   * @param currentAdminCount - 当前管理员数量
   * @param maxAdminCount - 最大管理员数限制
   * @returns 是否在限制范围内
   *
   * @example
   * ```typescript
   * const withinLimit = userRules.validateAdminCountLimit(5, 10); // true
   * const exceedsLimit = userRules.validateAdminCountLimit(15, 10); // false
   * ```
   *
   * @since 1.0.0
   */
  public validateAdminCountLimit(currentAdminCount: number, maxAdminCount: number): boolean {
    if (maxAdminCount === -1) {
      return true; // 无限制
    }

    return currentAdminCount < maxAdminCount;
  }

  /**
   * 验证角色分配权限
   *
   * @description 检查当前用户角色是否可以分配目标角色
   * 基于角色层级关系进行验证
   *
   * @param currentUserRole - 当前用户角色
   * @param targetRole - 目标角色
   * @returns 是否可以分配
   *
   * @example
   * ```typescript
   * const canAssign = userRules.validateRoleAssignmentPermission(
   *   UserRole.TENANT_ADMIN,
   *   UserRole.ORGANIZATION_ADMIN
   * ); // true
   * 
   * const cannotAssign = userRules.validateRoleAssignmentPermission(
   *   UserRole.REGULAR_USER,
   *   UserRole.TENANT_ADMIN
   * ); // false
   * ```
   *
   * @since 1.0.0
   */
  public validateRoleAssignmentPermission(currentUserRole: UserRole, targetRole: UserRole): boolean {
    // 定义角色层级关系
    const roleHierarchy: Record<UserRole, UserRole[]> = {
      [UserRole.PLATFORM_ADMIN]: [
        UserRole.PLATFORM_ADMIN,
        UserRole.TENANT_ADMIN,
        UserRole.ORGANIZATION_ADMIN,
        UserRole.DEPARTMENT_ADMIN,
        UserRole.REGULAR_USER
      ],
      [UserRole.TENANT_ADMIN]: [
        UserRole.ORGANIZATION_ADMIN,
        UserRole.DEPARTMENT_ADMIN,
        UserRole.REGULAR_USER
      ],
      [UserRole.ORGANIZATION_ADMIN]: [
        UserRole.DEPARTMENT_ADMIN,
        UserRole.REGULAR_USER
      ],
      [UserRole.DEPARTMENT_ADMIN]: [
        UserRole.REGULAR_USER
      ],
      [UserRole.REGULAR_USER]: [],
      [UserRole.GUEST_USER]: []
    };

    const allowedRoles = roleHierarchy[currentUserRole] || [];
    return allowedRoles.includes(targetRole);
  }

  /**
   * 验证用户状态转换
   *
   * @description 检查用户状态是否可以转换
   *
   * @param fromStatus - 原状态
   * @param toStatus - 目标状态
   * @returns 是否可以转换
   *
   * @example
   * ```typescript
   * const canActivate = userRules.canChangeUserStatus(
   *   UserStatus.PENDING,
   *   UserStatus.ACTIVE
   * ); // true
   * 
   * const cannotActivate = userRules.canChangeUserStatus(
   *   UserStatus.SUSPENDED,
   *   UserStatus.ACTIVE
   * ); // false
   * ```
   *
   * @since 1.0.0
   */
  public canChangeUserStatus(fromStatus: UserStatus, toStatus: UserStatus): boolean {
    // 相同状态不需要转换
    if (fromStatus === toStatus) {
      return true;
    }

    // 定义状态转换规则
    const allowedTransitions: Record<UserStatus, UserStatus[]> = {
      [UserStatus.PENDING]: [UserStatus.ACTIVE, UserStatus.REJECTED],
      [UserStatus.ACTIVE]: [UserStatus.SUSPENDED, UserStatus.DISABLED, UserStatus.LOCKED, UserStatus.EXPIRED],
      [UserStatus.SUSPENDED]: [UserStatus.ACTIVE, UserStatus.DISABLED],
      [UserStatus.DISABLED]: [UserStatus.ACTIVE], // 需要重新激活
      [UserStatus.LOCKED]: [UserStatus.ACTIVE, UserStatus.DISABLED], // 需要管理员解锁
      [UserStatus.EXPIRED]: [UserStatus.ACTIVE], // 需要重新激活
      [UserStatus.REJECTED]: [UserStatus.PENDING], // 可以重新申请
      [UserStatus.DELETED]: [] // 终态，不可转换
    };

    const allowedStatuses = allowedTransitions[fromStatus] || [];
    return allowedStatuses.includes(toStatus);
  }

  /**
   * 检查用户是否具有特定权限
   *
   * @description 基于用户角色检查是否具有指定权限
   *
   * @param userRole - 用户角色
   * @param permission - 权限名称
   * @returns 是否具有权限
   *
   * @example
   * ```typescript
   * const hasPermission = userRules.hasPermission(
   *   UserRole.TENANT_ADMIN,
   *   'user_management'
   * ); // true
   * 
   * const noPermission = userRules.hasPermission(
   *   UserRole.REGULAR_USER,
   *   'tenant_management'
   * ); // false
   * ```
   *
   * @since 1.0.0
   */
  public hasPermission(userRole: UserRole, permission: string): boolean {
    // 定义角色权限映射
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
      ],
      [UserRole.GUEST_USER]: [
        'read_only_access'
      ]
    };

    const permissions = rolePermissions[userRole] || [];
    return permissions.includes('*') || permissions.includes(permission);
  }

  /**
   * 获取用户的有效权限列表
   *
   * @description 根据用户角色返回其权限列表
   *
   * @param userRole - 用户角色
   * @param tenantId - 租户ID（用于租户特定权限）
   * @returns 权限列表
   *
   * @example
   * ```typescript
   * const permissions = userRules.getUserPermissions(UserRole.TENANT_ADMIN, 'tenant-123');
   * // ['tenant:tenant-123:tenant_management', 'tenant:tenant-123:user_management', ...]
   * ```
   *
   * @since 1.0.0
   */
  public getUserPermissions(userRole: UserRole, tenantId?: string): string[] {
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
      ],
      [UserRole.GUEST_USER]: [
        'read_only_access'
      ]
    };

    let permissions = basePermissions[userRole] || [];

    // 如果是租户特定用户，添加租户权限前缀
    if (tenantId && userRole !== UserRole.PLATFORM_ADMIN) {
      permissions = permissions.map(p => `tenant:${tenantId}:${p}`);
    }

    return permissions;
  }

  /**
   * 验证密码强度
   *
   * @description 验证密码是否符合强度要求
   *
   * @param password - 密码
   * @returns 是否强度足够
   *
   * @example
   * ```typescript
   * const isStrong = userRules.validatePasswordStrength('MyStr0ng!P@ssw0rd'); // true
   * const isWeak = userRules.validatePasswordStrength('123456'); // false
   * ```
   *
   * @since 1.0.0
   */
  public validatePasswordStrength(password: string): boolean {
    if (!password || typeof password !== 'string') {
      return false;
    }

    // 长度检查
    if (password.length < 8 || password.length > 128) {
      return false;
    }

    // 复杂度检查：至少包含大写字母、小写字母、数字和特殊字符
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars;
  }

  /**
   * 验证用户是否可以登录
   *
   * @description 检查用户状态是否允许登录
   *
   * @param userStatus - 用户状态
   * @returns 是否可以登录
   *
   * @example
   * ```typescript
   * const canLogin = userRules.canUserLogin(UserStatus.ACTIVE); // true
   * const cannotLogin = userRules.canUserLogin(UserStatus.SUSPENDED); // false
   * ```
   *
   * @since 1.0.0
   */
  public canUserLogin(userStatus: UserStatus): boolean {
    const allowedStatuses = [
      UserStatus.ACTIVE
    ];

    return allowedStatuses.includes(userStatus);
  }

  /**
   * 验证用户是否可以执行操作
   *
   * @description 检查用户状态是否允许执行操作
   *
   * @param userStatus - 用户状态
   * @returns 是否可以执行操作
   *
   * @example
   * ```typescript
   * const canOperate = userRules.canUserOperate(UserStatus.ACTIVE); // true
   * const cannotOperate = userRules.canUserOperate(UserStatus.DISABLED); // false
   * ```
   *
   * @since 1.0.0
   */
  public canUserOperate(userStatus: UserStatus): boolean {
    const allowedStatuses = [
      UserStatus.ACTIVE,
      UserStatus.SUSPENDED // 暂停用户可以查看但不能修改
    ];

    return allowedStatuses.includes(userStatus);
  }

  /**
   * 获取服务名称
   */
  getServiceName(): string {
    return 'UserBusinessRulesService';
  }
}
