/**
 * 接口层共享接口定义
 *
 * @description 定义接口层中所有共享的接口类型
 * 避免重复导出和类型冲突
 * @since 1.0.0
 */

/**
 * 日志服务接口
 *
 * @description 定义日志服务的基本接口
 */
export interface ILoggerService {
  info(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
}

/**
 * 监控服务接口
 *
 * @description 定义监控服务的基本接口
 */
export interface IMetricsService {
  incrementCounter(name: string, labels?: Record<string, string>): void;
  recordHistogram(
    name: string,
    value: number,
    labels?: Record<string, string>
  ): void;
  recordGauge(
    name: string,
    value: number,
    labels?: Record<string, string>
  ): void;
}

/**
 * 用户上下文接口
 *
 * @description 定义用户上下文的数据结构
 */
export interface IUserContext {
  userId: string;
  email: string;
  name: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
}

/**
 * 实体ID接口
 *
 * @description 定义实体ID的基本接口
 */
export interface IEntityId {
  getValue(): string;
}

/**
 * 邮箱接口
 *
 * @description 定义邮箱值对象的基本接口
 */
export interface IEmail {
  getValue(): string;
}

/**
 * 用户名接口
 *
 * @description 定义用户名值对象的基本接口
 */
export interface IUserName {
  getValue(): string;
}

/**
 * 用户接口
 *
 * @description 定义用户实体的基本接口
 */
export interface IUser {
  getId(): IEntityId;
  getEmail(): IEmail;
  getName(): IUserName;
  getTenantId(): string;
  getRoles(): IRole[];
  getPermissions(): IPermission[];
  isActive(): boolean;
}

/**
 * 角色接口
 *
 * @description 定义角色的基本接口
 */
export interface IRole {
  getName(): string;
}

/**
 * 权限接口
 *
 * @description 定义权限的基本接口
 */
export interface IPermission {
  getName(): string;
}

/**
 * 请求上下文接口
 *
 * @description 定义请求上下文的数据结构
 */
export interface IRequestContext {
  requestId: string;
  correlationId: string;
  userId: string;
  tenantId: string;
  timestamp: Date;
  clientInfo?: {
    userAgent?: string;
    ip?: string;
    referer?: string;
  };
}

/**
 * GraphQL上下文接口
 *
 * @description 定义GraphQL上下文的数据结构
 */
export interface IGraphQLContext {
  requestId: string;
  correlationId: string;
  userId: string;
  tenantId: string;
  timestamp: Date;
  clientInfo?: {
    userAgent?: string;
    ip?: string;
    referer?: string;
  };
}

/**
 * WebSocket上下文接口
 *
 * @description 定义WebSocket上下文的数据结构
 */
export interface IWebSocketContext {
  requestId: string;
  correlationId: string;
  userId: string;
  tenantId: string;
  timestamp: Date;
  clientInfo?: {
    userAgent?: string;
    ip?: string;
    referer?: string;
  };
}
