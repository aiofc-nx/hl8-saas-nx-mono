/**
 * 审计事件类型枚举
 *
 * @description 定义系统中所有需要审计的事件类型
 * 提供完整的审计事件分类和管理
 *
 * ## 业务规则
 *
 * ### 事件分类
 * - 认证事件：登录、登出、密码变更、MFA等
 * - 授权事件：权限分配、角色变更、访问控制等
 * - 数据事件：创建、读取、更新、删除等
 * - 系统事件：配置变更、系统维护、错误处理等
 * - 安全事件：异常访问、攻击尝试、安全违规等
 *
 * ### 审计级别
 * - CRITICAL: 关键事件，需要立即关注
 * - HIGH: 高优先级事件，需要及时处理
 * - MEDIUM: 中等优先级事件，需要记录
 * - LOW: 低优先级事件，用于统计分析
 *
 * ### 合规要求
 * - 符合SOX、GDPR、HIPAA等合规标准
 * - 支持审计日志的完整性保护
 * - 支持审计日志的不可篡改性
 *
 * @example
 * ```typescript
 * const eventType = AuditEventType.USER_LOGIN;
 * const level = AuditEventTypeUtils.getAuditLevel(eventType); // 'HIGH'
 * const category = AuditEventTypeUtils.getCategory(eventType); // 'AUTHENTICATION'
 * ```
 *
 * @since 1.0.0
 */
export enum AuditEventType {
  // ==================== 认证事件 ====================
  
  /** 用户登录 */
  USER_LOGIN = 'USER_LOGIN',
  
  /** 用户登出 */
  USER_LOGOUT = 'USER_LOGOUT',
  
  /** 登录失败 */
  LOGIN_FAILED = 'LOGIN_FAILED',
  
  /** 密码变更 */
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  
  /** 密码重置 */
  PASSWORD_RESET = 'PASSWORD_RESET',
  
  /** MFA启用 */
  MFA_ENABLED = 'MFA_ENABLED',
  
  /** MFA禁用 */
  MFA_DISABLED = 'MFA_DISABLED',
  
  /** MFA验证成功 */
  MFA_VERIFICATION_SUCCESS = 'MFA_VERIFICATION_SUCCESS',
  
  /** MFA验证失败 */
  MFA_VERIFICATION_FAILED = 'MFA_VERIFICATION_FAILED',
  
  /** 账户锁定 */
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  
  /** 账户解锁 */
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  
  /** 会话超时 */
  SESSION_TIMEOUT = 'SESSION_TIMEOUT',
  
  /** 会话终止 */
  SESSION_TERMINATED = 'SESSION_TERMINATED',
  
  // ==================== 授权事件 ====================
  
  /** 权限分配 */
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  
  /** 权限撤销 */
  PERMISSION_REVOKED = 'PERMISSION_REVOKED',
  
  /** 角色分配 */
  ROLE_ASSIGNED = 'ROLE_ASSIGNED',
  
  /** 角色移除 */
  ROLE_REMOVED = 'ROLE_REMOVED',
  
  /** 角色创建 */
  ROLE_CREATED = 'ROLE_CREATED',
  
  /** 角色更新 */
  ROLE_UPDATED = 'ROLE_UPDATED',
  
  /** 角色删除 */
  ROLE_DELETED = 'ROLE_DELETED',
  
  /** 访问控制变更 */
  ACCESS_CONTROL_CHANGED = 'ACCESS_CONTROL_CHANGED',
  
  // ==================== 数据事件 ====================
  
  /** 用户创建 */
  USER_CREATED = 'USER_CREATED',
  
  /** 用户更新 */
  USER_UPDATED = 'USER_UPDATED',
  
  /** 用户删除 */
  USER_DELETED = 'USER_DELETED',
  
  /** 租户创建 */
  TENANT_CREATED = 'TENANT_CREATED',
  
  /** 租户更新 */
  TENANT_UPDATED = 'TENANT_UPDATED',
  
  /** 租户删除 */
  TENANT_DELETED = 'TENANT_DELETED',
  
  /** 组织创建 */
  ORGANIZATION_CREATED = 'ORGANIZATION_CREATED',
  
  /** 组织更新 */
  ORGANIZATION_UPDATED = 'ORGANIZATION_UPDATED',
  
  /** 组织删除 */
  ORGANIZATION_DELETED = 'ORGANIZATION_DELETED',
  
  /** 部门创建 */
  DEPARTMENT_CREATED = 'DEPARTMENT_CREATED',
  
  /** 部门更新 */
  DEPARTMENT_UPDATED = 'DEPARTMENT_UPDATED',
  
  /** 部门删除 */
  DEPARTMENT_DELETED = 'DEPARTMENT_DELETED',
  
  /** 数据导出 */
  DATA_EXPORTED = 'DATA_EXPORTED',
  
  /** 数据导入 */
  DATA_IMPORTED = 'DATA_IMPORTED',
  
  /** 数据备份 */
  DATA_BACKED_UP = 'DATA_BACKED_UP',
  
  /** 数据恢复 */
  DATA_RESTORED = 'DATA_RESTORED',
  
  // ==================== 系统事件 ====================
  
  /** 系统启动 */
  SYSTEM_STARTED = 'SYSTEM_STARTED',
  
  /** 系统关闭 */
  SYSTEM_SHUTDOWN = 'SYSTEM_SHUTDOWN',
  
  /** 配置变更 */
  CONFIGURATION_CHANGED = 'CONFIGURATION_CHANGED',
  
  /** 系统维护 */
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  
  /** 系统错误 */
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  
  /** 性能警告 */
  PERFORMANCE_WARNING = 'PERFORMANCE_WARNING',
  
  /** 资源使用警告 */
  RESOURCE_USAGE_WARNING = 'RESOURCE_USAGE_WARNING',
  
  /** 数据库连接 */
  DATABASE_CONNECTION = 'DATABASE_CONNECTION',
  
  /** 数据库断开 */
  DATABASE_DISCONNECTION = 'DATABASE_DISCONNECTION',
  
  // ==================== 安全事件 ====================
  
  /** 异常访问尝试 */
  SUSPICIOUS_ACCESS_ATTEMPT = 'SUSPICIOUS_ACCESS_ATTEMPT',
  
  /** 暴力破解攻击 */
  BRUTE_FORCE_ATTACK = 'BRUTE_FORCE_ATTACK',
  
  /** SQL注入尝试 */
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  
  /** XSS攻击尝试 */
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  
  /** CSRF攻击尝试 */
  CSRF_ATTEMPT = 'CSRF_ATTEMPT',
  
  /** 权限提升尝试 */
  PRIVILEGE_ESCALATION_ATTEMPT = 'PRIVILEGE_ESCALATION_ATTEMPT',
  
  /** 数据泄露尝试 */
  DATA_BREACH_ATTEMPT = 'DATA_BREACH_ATTEMPT',
  
  /** 恶意软件检测 */
  MALWARE_DETECTED = 'MALWARE_DETECTED',
  
  /** 安全策略违规 */
  SECURITY_POLICY_VIOLATION = 'SECURITY_POLICY_VIOLATION',
  
  // ==================== 业务事件 ====================
  
  /** 业务操作执行 */
  BUSINESS_OPERATION_EXECUTED = 'BUSINESS_OPERATION_EXECUTED',
  
  /** 业务流程启动 */
  BUSINESS_PROCESS_STARTED = 'BUSINESS_PROCESS_STARTED',
  
  /** 业务流程完成 */
  BUSINESS_PROCESS_COMPLETED = 'BUSINESS_PROCESS_COMPLETED',
  
  /** 业务流程失败 */
  BUSINESS_PROCESS_FAILED = 'BUSINESS_PROCESS_FAILED',
  
  /** 审批请求 */
  APPROVAL_REQUESTED = 'APPROVAL_REQUESTED',
  
  /** 审批通过 */
  APPROVAL_GRANTED = 'APPROVAL_GRANTED',
  
  /** 审批拒绝 */
  APPROVAL_DENIED = 'APPROVAL_DENIED',
  
  /** 通知发送 */
  NOTIFICATION_SENT = 'NOTIFICATION_SENT',
  
  /** 集成调用 */
  INTEGRATION_CALLED = 'INTEGRATION_CALLED',
  
  /** API调用 */
  API_CALLED = 'API_CALLED'
}

/**
 * 审计事件类型工具类
 *
 * @description 提供审计事件类型相关的工具方法
 * 包括事件分类、审计级别、合规检查等功能
 *
 * @since 1.0.0
 */
export class AuditEventTypeUtils {
  /**
   * 事件分类定义
   * 
   * @description 定义事件的分组分类
   */
  private static readonly EVENT_CATEGORIES: Record<string, AuditEventType[]> = {
    AUTHENTICATION: [
      AuditEventType.USER_LOGIN,
      AuditEventType.USER_LOGOUT,
      AuditEventType.LOGIN_FAILED,
      AuditEventType.PASSWORD_CHANGED,
      AuditEventType.PASSWORD_RESET,
      AuditEventType.MFA_ENABLED,
      AuditEventType.MFA_DISABLED,
      AuditEventType.MFA_VERIFICATION_SUCCESS,
      AuditEventType.MFA_VERIFICATION_FAILED,
      AuditEventType.ACCOUNT_LOCKED,
      AuditEventType.ACCOUNT_UNLOCKED,
      AuditEventType.SESSION_TIMEOUT,
      AuditEventType.SESSION_TERMINATED
    ],
    
    AUTHORIZATION: [
      AuditEventType.PERMISSION_GRANTED,
      AuditEventType.PERMISSION_REVOKED,
      AuditEventType.ROLE_ASSIGNED,
      AuditEventType.ROLE_REMOVED,
      AuditEventType.ROLE_CREATED,
      AuditEventType.ROLE_UPDATED,
      AuditEventType.ROLE_DELETED,
      AuditEventType.ACCESS_CONTROL_CHANGED
    ],
    
    DATA: [
      AuditEventType.USER_CREATED,
      AuditEventType.USER_UPDATED,
      AuditEventType.USER_DELETED,
      AuditEventType.TENANT_CREATED,
      AuditEventType.TENANT_UPDATED,
      AuditEventType.TENANT_DELETED,
      AuditEventType.ORGANIZATION_CREATED,
      AuditEventType.ORGANIZATION_UPDATED,
      AuditEventType.ORGANIZATION_DELETED,
      AuditEventType.DEPARTMENT_CREATED,
      AuditEventType.DEPARTMENT_UPDATED,
      AuditEventType.DEPARTMENT_DELETED,
      AuditEventType.DATA_EXPORTED,
      AuditEventType.DATA_IMPORTED,
      AuditEventType.DATA_BACKED_UP,
      AuditEventType.DATA_RESTORED
    ],
    
    SYSTEM: [
      AuditEventType.SYSTEM_STARTED,
      AuditEventType.SYSTEM_SHUTDOWN,
      AuditEventType.CONFIGURATION_CHANGED,
      AuditEventType.SYSTEM_MAINTENANCE,
      AuditEventType.SYSTEM_ERROR,
      AuditEventType.PERFORMANCE_WARNING,
      AuditEventType.RESOURCE_USAGE_WARNING,
      AuditEventType.DATABASE_CONNECTION,
      AuditEventType.DATABASE_DISCONNECTION
    ],
    
    SECURITY: [
      AuditEventType.SUSPICIOUS_ACCESS_ATTEMPT,
      AuditEventType.BRUTE_FORCE_ATTACK,
      AuditEventType.SQL_INJECTION_ATTEMPT,
      AuditEventType.XSS_ATTEMPT,
      AuditEventType.CSRF_ATTEMPT,
      AuditEventType.PRIVILEGE_ESCALATION_ATTEMPT,
      AuditEventType.DATA_BREACH_ATTEMPT,
      AuditEventType.MALWARE_DETECTED,
      AuditEventType.SECURITY_POLICY_VIOLATION
    ],
    
    BUSINESS: [
      AuditEventType.BUSINESS_OPERATION_EXECUTED,
      AuditEventType.BUSINESS_PROCESS_STARTED,
      AuditEventType.BUSINESS_PROCESS_COMPLETED,
      AuditEventType.BUSINESS_PROCESS_FAILED,
      AuditEventType.APPROVAL_REQUESTED,
      AuditEventType.APPROVAL_GRANTED,
      AuditEventType.APPROVAL_DENIED,
      AuditEventType.NOTIFICATION_SENT,
      AuditEventType.INTEGRATION_CALLED,
      AuditEventType.API_CALLED
    ]
  };

  /**
   * 审计级别定义
   * 
   * @description 定义不同事件的审计级别
   */
  private static readonly AUDIT_LEVELS: Record<AuditEventType, 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'> = {
    // 认证事件
    [AuditEventType.USER_LOGIN]: 'HIGH',
    [AuditEventType.USER_LOGOUT]: 'LOW',
    [AuditEventType.LOGIN_FAILED]: 'HIGH',
    [AuditEventType.PASSWORD_CHANGED]: 'HIGH',
    [AuditEventType.PASSWORD_RESET]: 'CRITICAL',
    [AuditEventType.MFA_ENABLED]: 'HIGH',
    [AuditEventType.MFA_DISABLED]: 'HIGH',
    [AuditEventType.MFA_VERIFICATION_SUCCESS]: 'MEDIUM',
    [AuditEventType.MFA_VERIFICATION_FAILED]: 'HIGH',
    [AuditEventType.ACCOUNT_LOCKED]: 'HIGH',
    [AuditEventType.ACCOUNT_UNLOCKED]: 'HIGH',
    [AuditEventType.SESSION_TIMEOUT]: 'LOW',
    [AuditEventType.SESSION_TERMINATED]: 'MEDIUM',
    
    // 授权事件
    [AuditEventType.PERMISSION_GRANTED]: 'HIGH',
    [AuditEventType.PERMISSION_REVOKED]: 'HIGH',
    [AuditEventType.ROLE_ASSIGNED]: 'HIGH',
    [AuditEventType.ROLE_REMOVED]: 'HIGH',
    [AuditEventType.ROLE_CREATED]: 'HIGH',
    [AuditEventType.ROLE_UPDATED]: 'HIGH',
    [AuditEventType.ROLE_DELETED]: 'CRITICAL',
    [AuditEventType.ACCESS_CONTROL_CHANGED]: 'CRITICAL',
    
    // 数据事件
    [AuditEventType.USER_CREATED]: 'HIGH',
    [AuditEventType.USER_UPDATED]: 'MEDIUM',
    [AuditEventType.USER_DELETED]: 'CRITICAL',
    [AuditEventType.TENANT_CREATED]: 'CRITICAL',
    [AuditEventType.TENANT_UPDATED]: 'HIGH',
    [AuditEventType.TENANT_DELETED]: 'CRITICAL',
    [AuditEventType.ORGANIZATION_CREATED]: 'HIGH',
    [AuditEventType.ORGANIZATION_UPDATED]: 'MEDIUM',
    [AuditEventType.ORGANIZATION_DELETED]: 'CRITICAL',
    [AuditEventType.DEPARTMENT_CREATED]: 'MEDIUM',
    [AuditEventType.DEPARTMENT_UPDATED]: 'LOW',
    [AuditEventType.DEPARTMENT_DELETED]: 'HIGH',
    [AuditEventType.DATA_EXPORTED]: 'HIGH',
    [AuditEventType.DATA_IMPORTED]: 'HIGH',
    [AuditEventType.DATA_BACKED_UP]: 'MEDIUM',
    [AuditEventType.DATA_RESTORED]: 'CRITICAL',
    
    // 系统事件
    [AuditEventType.SYSTEM_STARTED]: 'MEDIUM',
    [AuditEventType.SYSTEM_SHUTDOWN]: 'HIGH',
    [AuditEventType.CONFIGURATION_CHANGED]: 'HIGH',
    [AuditEventType.SYSTEM_MAINTENANCE]: 'MEDIUM',
    [AuditEventType.SYSTEM_ERROR]: 'HIGH',
    [AuditEventType.PERFORMANCE_WARNING]: 'MEDIUM',
    [AuditEventType.RESOURCE_USAGE_WARNING]: 'MEDIUM',
    [AuditEventType.DATABASE_CONNECTION]: 'LOW',
    [AuditEventType.DATABASE_DISCONNECTION]: 'MEDIUM',
    
    // 安全事件
    [AuditEventType.SUSPICIOUS_ACCESS_ATTEMPT]: 'HIGH',
    [AuditEventType.BRUTE_FORCE_ATTACK]: 'CRITICAL',
    [AuditEventType.SQL_INJECTION_ATTEMPT]: 'CRITICAL',
    [AuditEventType.XSS_ATTEMPT]: 'CRITICAL',
    [AuditEventType.CSRF_ATTEMPT]: 'CRITICAL',
    [AuditEventType.PRIVILEGE_ESCALATION_ATTEMPT]: 'CRITICAL',
    [AuditEventType.DATA_BREACH_ATTEMPT]: 'CRITICAL',
    [AuditEventType.MALWARE_DETECTED]: 'CRITICAL',
    [AuditEventType.SECURITY_POLICY_VIOLATION]: 'HIGH',
    
    // 业务事件
    [AuditEventType.BUSINESS_OPERATION_EXECUTED]: 'MEDIUM',
    [AuditEventType.BUSINESS_PROCESS_STARTED]: 'LOW',
    [AuditEventType.BUSINESS_PROCESS_COMPLETED]: 'LOW',
    [AuditEventType.BUSINESS_PROCESS_FAILED]: 'MEDIUM',
    [AuditEventType.APPROVAL_REQUESTED]: 'MEDIUM',
    [AuditEventType.APPROVAL_GRANTED]: 'HIGH',
    [AuditEventType.APPROVAL_DENIED]: 'HIGH',
    [AuditEventType.NOTIFICATION_SENT]: 'LOW',
    [AuditEventType.INTEGRATION_CALLED]: 'MEDIUM',
    [AuditEventType.API_CALLED]: 'LOW'
  };

  /**
   * 合规要求定义
   * 
   * @description 定义不同事件需要满足的合规要求
   */
  private static readonly COMPLIANCE_REQUIREMENTS: Record<AuditEventType, string[]> = {
    // 认证事件
    [AuditEventType.USER_LOGIN]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.USER_LOGOUT]: ['SOX', 'GDPR'],
    [AuditEventType.LOGIN_FAILED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.PASSWORD_CHANGED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.PASSWORD_RESET]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.MFA_ENABLED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.MFA_DISABLED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.MFA_VERIFICATION_SUCCESS]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.MFA_VERIFICATION_FAILED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.ACCOUNT_LOCKED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.ACCOUNT_UNLOCKED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.SESSION_TIMEOUT]: ['SOX', 'GDPR'],
    [AuditEventType.SESSION_TERMINATED]: ['SOX', 'GDPR'],
    
    // 授权事件
    [AuditEventType.PERMISSION_GRANTED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.PERMISSION_REVOKED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.ROLE_ASSIGNED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.ROLE_REMOVED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.ROLE_CREATED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.ROLE_UPDATED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.ROLE_DELETED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.ACCESS_CONTROL_CHANGED]: ['SOX', 'GDPR', 'HIPAA'],
    
    // 数据事件
    [AuditEventType.USER_CREATED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.USER_UPDATED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.USER_DELETED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.TENANT_CREATED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.TENANT_UPDATED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.TENANT_DELETED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.ORGANIZATION_CREATED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.ORGANIZATION_UPDATED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.ORGANIZATION_DELETED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.DEPARTMENT_CREATED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.DEPARTMENT_UPDATED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.DEPARTMENT_DELETED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.DATA_EXPORTED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.DATA_IMPORTED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.DATA_BACKED_UP]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.DATA_RESTORED]: ['SOX', 'GDPR', 'HIPAA'],
    
    // 系统事件
    [AuditEventType.SYSTEM_STARTED]: ['SOX'],
    [AuditEventType.SYSTEM_SHUTDOWN]: ['SOX'],
    [AuditEventType.CONFIGURATION_CHANGED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.SYSTEM_MAINTENANCE]: ['SOX'],
    [AuditEventType.SYSTEM_ERROR]: ['SOX'],
    [AuditEventType.PERFORMANCE_WARNING]: [],
    [AuditEventType.RESOURCE_USAGE_WARNING]: [],
    [AuditEventType.DATABASE_CONNECTION]: ['SOX'],
    [AuditEventType.DATABASE_DISCONNECTION]: ['SOX'],
    
    // 安全事件
    [AuditEventType.SUSPICIOUS_ACCESS_ATTEMPT]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.BRUTE_FORCE_ATTACK]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.SQL_INJECTION_ATTEMPT]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.XSS_ATTEMPT]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.CSRF_ATTEMPT]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.PRIVILEGE_ESCALATION_ATTEMPT]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.DATA_BREACH_ATTEMPT]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.MALWARE_DETECTED]: ['SOX', 'GDPR', 'HIPAA'],
    [AuditEventType.SECURITY_POLICY_VIOLATION]: ['SOX', 'GDPR', 'HIPAA'],
    
    // 业务事件
    [AuditEventType.BUSINESS_OPERATION_EXECUTED]: ['SOX', 'GDPR'],
    [AuditEventType.BUSINESS_PROCESS_STARTED]: ['SOX'],
    [AuditEventType.BUSINESS_PROCESS_COMPLETED]: ['SOX'],
    [AuditEventType.BUSINESS_PROCESS_FAILED]: ['SOX'],
    [AuditEventType.APPROVAL_REQUESTED]: ['SOX', 'GDPR'],
    [AuditEventType.APPROVAL_GRANTED]: ['SOX', 'GDPR'],
    [AuditEventType.APPROVAL_DENIED]: ['SOX', 'GDPR'],
    [AuditEventType.NOTIFICATION_SENT]: ['GDPR'],
    [AuditEventType.INTEGRATION_CALLED]: ['SOX', 'GDPR'],
    [AuditEventType.API_CALLED]: ['SOX', 'GDPR']
  };

  /**
   * 获取事件分类
   *
   * @description 获取指定事件所属的分类
   *
   * @param eventType - 审计事件类型
   * @returns 事件分类
   *
   * @example
   * ```typescript
   * const category = AuditEventTypeUtils.getCategory(AuditEventType.USER_LOGIN);
   * // 'AUTHENTICATION'
   * ```
   *
   * @since 1.0.0
   */
  public static getCategory(eventType: AuditEventType): string {
    for (const [category, events] of Object.entries(this.EVENT_CATEGORIES)) {
      if (events.includes(eventType)) {
        return category;
      }
    }
    return 'UNKNOWN';
  }

  /**
   * 获取审计级别
   *
   * @description 获取指定事件的审计级别
   *
   * @param eventType - 审计事件类型
   * @returns 审计级别
   *
   * @example
   * ```typescript
   * const level = AuditEventTypeUtils.getAuditLevel(AuditEventType.USER_LOGIN);
   * // 'HIGH'
   * ```
   *
   * @since 1.0.0
   */
  public static getAuditLevel(eventType: AuditEventType): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    return this.AUDIT_LEVELS[eventType];
  }

  /**
   * 获取合规要求
   *
   * @description 获取指定事件需要满足的合规要求
   *
   * @param eventType - 审计事件类型
   * @returns 合规要求列表
   *
   * @example
   * ```typescript
   * const requirements = AuditEventTypeUtils.getComplianceRequirements(AuditEventType.USER_LOGIN);
   * // ['SOX', 'GDPR', 'HIPAA']
   * ```
   *
   * @since 1.0.0
   */
  public static getComplianceRequirements(eventType: AuditEventType): string[] {
    return [...(this.COMPLIANCE_REQUIREMENTS[eventType] || [])];
  }

  /**
   * 获取分类下的所有事件
   *
   * @description 获取指定分类下的所有事件类型
   *
   * @param category - 事件分类
   * @returns 事件类型列表
   *
   * @example
   * ```typescript
   * const events = AuditEventTypeUtils.getEventsByCategory('AUTHENTICATION');
   * ```
   *
   * @since 1.0.0
   */
  public static getEventsByCategory(category: string): AuditEventType[] {
    return [...(this.EVENT_CATEGORIES[category] || [])];
  }

  /**
   * 获取指定审计级别的事件
   *
   * @description 获取指定审计级别的所有事件类型
   *
   * @param level - 审计级别
   * @returns 事件类型列表
   *
   * @example
   * ```typescript
   * const criticalEvents = AuditEventTypeUtils.getEventsByLevel('CRITICAL');
   * ```
   *
   * @since 1.0.0
   */
  public static getEventsByLevel(level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'): AuditEventType[] {
    return Object.entries(this.AUDIT_LEVELS)
      .filter(([_, eventLevel]) => eventLevel === level)
      .map(([eventType, _]) => eventType as AuditEventType);
  }

  /**
   * 获取指定合规要求的事件
   *
   * @description 获取需要满足指定合规要求的所有事件类型
   *
   * @param compliance - 合规要求
   * @returns 事件类型列表
   *
   * @example
   * ```typescript
   * const gdprEvents = AuditEventTypeUtils.getEventsByCompliance('GDPR');
   * ```
   *
   * @since 1.0.0
   */
  public static getEventsByCompliance(compliance: string): AuditEventType[] {
    return Object.entries(this.COMPLIANCE_REQUIREMENTS)
      .filter(([_, requirements]) => requirements.includes(compliance))
      .map(([eventType, _]) => eventType as AuditEventType);
  }

  /**
   * 检查是否为关键事件
   *
   * @description 判断指定事件是否为关键事件
   *
   * @param eventType - 审计事件类型
   * @returns 是否为关键事件
   *
   * @example
   * ```typescript
   * const isCritical = AuditEventTypeUtils.isCriticalEvent(AuditEventType.PASSWORD_RESET);
   * // true
   * ```
   *
   * @since 1.0.0
   */
  public static isCriticalEvent(eventType: AuditEventType): boolean {
    return this.getAuditLevel(eventType) === 'CRITICAL';
  }

  /**
   * 检查是否为安全事件
   *
   * @description 判断指定事件是否为安全相关事件
   *
   * @param eventType - 审计事件类型
   * @returns 是否为安全事件
   *
   * @example
   * ```typescript
   * const isSecurity = AuditEventTypeUtils.isSecurityEvent(AuditEventType.BRUTE_FORCE_ATTACK);
   * // true
   * ```
   *
   * @since 1.0.0
   */
  public static isSecurityEvent(eventType: AuditEventType): boolean {
    return this.getCategory(eventType) === 'SECURITY';
  }

  /**
   * 获取事件的中文描述
   *
   * @description 返回事件的中文描述，用于界面显示
   *
   * @param eventType - 审计事件类型
   * @returns 中文描述
   *
   * @example
   * ```typescript
   * const description = AuditEventTypeUtils.getDescription(AuditEventType.USER_LOGIN);
   * // "用户登录"
   * ```
   *
   * @since 1.0.0
   */
  public static getDescription(eventType: AuditEventType): string {
    const descriptions: Record<AuditEventType, string> = {
      // 认证事件
      [AuditEventType.USER_LOGIN]: '用户登录',
      [AuditEventType.USER_LOGOUT]: '用户登出',
      [AuditEventType.LOGIN_FAILED]: '登录失败',
      [AuditEventType.PASSWORD_CHANGED]: '密码变更',
      [AuditEventType.PASSWORD_RESET]: '密码重置',
      [AuditEventType.MFA_ENABLED]: 'MFA启用',
      [AuditEventType.MFA_DISABLED]: 'MFA禁用',
      [AuditEventType.MFA_VERIFICATION_SUCCESS]: 'MFA验证成功',
      [AuditEventType.MFA_VERIFICATION_FAILED]: 'MFA验证失败',
      [AuditEventType.ACCOUNT_LOCKED]: '账户锁定',
      [AuditEventType.ACCOUNT_UNLOCKED]: '账户解锁',
      [AuditEventType.SESSION_TIMEOUT]: '会话超时',
      [AuditEventType.SESSION_TERMINATED]: '会话终止',
      
      // 授权事件
      [AuditEventType.PERMISSION_GRANTED]: '权限分配',
      [AuditEventType.PERMISSION_REVOKED]: '权限撤销',
      [AuditEventType.ROLE_ASSIGNED]: '角色分配',
      [AuditEventType.ROLE_REMOVED]: '角色移除',
      [AuditEventType.ROLE_CREATED]: '角色创建',
      [AuditEventType.ROLE_UPDATED]: '角色更新',
      [AuditEventType.ROLE_DELETED]: '角色删除',
      [AuditEventType.ACCESS_CONTROL_CHANGED]: '访问控制变更',
      
      // 数据事件
      [AuditEventType.USER_CREATED]: '用户创建',
      [AuditEventType.USER_UPDATED]: '用户更新',
      [AuditEventType.USER_DELETED]: '用户删除',
      [AuditEventType.TENANT_CREATED]: '租户创建',
      [AuditEventType.TENANT_UPDATED]: '租户更新',
      [AuditEventType.TENANT_DELETED]: '租户删除',
      [AuditEventType.ORGANIZATION_CREATED]: '组织创建',
      [AuditEventType.ORGANIZATION_UPDATED]: '组织更新',
      [AuditEventType.ORGANIZATION_DELETED]: '组织删除',
      [AuditEventType.DEPARTMENT_CREATED]: '部门创建',
      [AuditEventType.DEPARTMENT_UPDATED]: '部门更新',
      [AuditEventType.DEPARTMENT_DELETED]: '部门删除',
      [AuditEventType.DATA_EXPORTED]: '数据导出',
      [AuditEventType.DATA_IMPORTED]: '数据导入',
      [AuditEventType.DATA_BACKED_UP]: '数据备份',
      [AuditEventType.DATA_RESTORED]: '数据恢复',
      
      // 系统事件
      [AuditEventType.SYSTEM_STARTED]: '系统启动',
      [AuditEventType.SYSTEM_SHUTDOWN]: '系统关闭',
      [AuditEventType.CONFIGURATION_CHANGED]: '配置变更',
      [AuditEventType.SYSTEM_MAINTENANCE]: '系统维护',
      [AuditEventType.SYSTEM_ERROR]: '系统错误',
      [AuditEventType.PERFORMANCE_WARNING]: '性能警告',
      [AuditEventType.RESOURCE_USAGE_WARNING]: '资源使用警告',
      [AuditEventType.DATABASE_CONNECTION]: '数据库连接',
      [AuditEventType.DATABASE_DISCONNECTION]: '数据库断开',
      
      // 安全事件
      [AuditEventType.SUSPICIOUS_ACCESS_ATTEMPT]: '异常访问尝试',
      [AuditEventType.BRUTE_FORCE_ATTACK]: '暴力破解攻击',
      [AuditEventType.SQL_INJECTION_ATTEMPT]: 'SQL注入尝试',
      [AuditEventType.XSS_ATTEMPT]: 'XSS攻击尝试',
      [AuditEventType.CSRF_ATTEMPT]: 'CSRF攻击尝试',
      [AuditEventType.PRIVILEGE_ESCALATION_ATTEMPT]: '权限提升尝试',
      [AuditEventType.DATA_BREACH_ATTEMPT]: '数据泄露尝试',
      [AuditEventType.MALWARE_DETECTED]: '恶意软件检测',
      [AuditEventType.SECURITY_POLICY_VIOLATION]: '安全策略违规',
      
      // 业务事件
      [AuditEventType.BUSINESS_OPERATION_EXECUTED]: '业务操作执行',
      [AuditEventType.BUSINESS_PROCESS_STARTED]: '业务流程启动',
      [AuditEventType.BUSINESS_PROCESS_COMPLETED]: '业务流程完成',
      [AuditEventType.BUSINESS_PROCESS_FAILED]: '业务流程失败',
      [AuditEventType.APPROVAL_REQUESTED]: '审批请求',
      [AuditEventType.APPROVAL_GRANTED]: '审批通过',
      [AuditEventType.APPROVAL_DENIED]: '审批拒绝',
      [AuditEventType.NOTIFICATION_SENT]: '通知发送',
      [AuditEventType.INTEGRATION_CALLED]: '集成调用',
      [AuditEventType.API_CALLED]: 'API调用'
    };

    return descriptions[eventType] || eventType;
  }

  /**
   * 获取所有事件类型
   *
   * @description 返回系统中定义的所有审计事件类型
   *
   * @returns 所有事件类型列表
   *
   * @example
   * ```typescript
   * const allEvents = AuditEventTypeUtils.getAllEventTypes();
   * ```
   *
   * @since 1.0.0
   */
  public static getAllEventTypes(): AuditEventType[] {
    return Object.values(AuditEventType);
  }

  /**
   * 获取所有分类
   *
   * @description 返回系统中定义的所有事件分类
   *
   * @returns 所有分类列表
   *
   * @example
   * ```typescript
   * const categories = AuditEventTypeUtils.getAllCategories();
   * ```
   *
   * @since 1.0.0
   */
  public static getAllCategories(): string[] {
    return Object.keys(this.EVENT_CATEGORIES);
  }

  /**
   * 获取所有合规要求
   *
   * @description 返回系统中定义的所有合规要求
   *
   * @returns 所有合规要求列表
   *
   * @example
   * ```typescript
   * const compliances = AuditEventTypeUtils.getAllCompliances();
   * ```
   *
   * @since 1.0.0
   */
  public static getAllCompliances(): string[] {
    const allCompliances = new Set<string>();
    Object.values(this.COMPLIANCE_REQUIREMENTS).forEach(requirements => {
      requirements.forEach(compliance => allCompliances.add(compliance));
    });
    return Array.from(allCompliances);
  }
}
