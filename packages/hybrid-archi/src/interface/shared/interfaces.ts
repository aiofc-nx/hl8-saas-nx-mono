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
  userRoles?: string[];
  userPermissions?: string[];
  clientInfo?: {
    userAgent?: string;
    ip?: string;
    referer?: string;
  };
}

/**
 * WebSocket客户端接口
 *
 * @description 定义WebSocket客户端的基本结构
 * 基于Socket.IO客户端接口设计
 */
export interface IWebSocketClient {
  /** 客户端唯一标识符 */
  id: string;
  /** 握手信息 */
  handshake: {
    /** 认证信息 */
    auth?: {
      token?: string;
      [key: string]: unknown;
    };
    /** 请求头 */
    headers: {
      authorization?: string;
      [key: string]: string | string[] | undefined;
    };
    /** 客户端IP地址 */
    address: string;
    /** 查询参数 */
    query?: Record<string, string>;
    /** 时间戳 */
    time: string;
    /** 请求URL */
    url: string;
    /** 传输协议 */
    transport: string;
  };
  /** 连接状态 */
  connected: boolean;
  /** 断开连接 */
  disconnect(close?: boolean): void;
  /** 发送消息 */
  emit(event: string, ...args: unknown[]): void;
}

/**
 * JWT令牌载荷接口
 *
 * @description 定义JWT令牌载荷的数据结构
 */
export interface IJwtPayload {
  /** 用户ID */
  sub: string;
  /** 租户ID */
  tenantId: string;
  /** 用户邮箱 */
  email: string;
  /** 用户名 */
  name: string;
  /** 用户角色 */
  roles: string[];
  /** 用户权限 */
  permissions: string[];
  /** 令牌签发时间 */
  iat: number;
  /** 令牌过期时间 */
  exp: number;
  /** 令牌类型 */
  type?: string;
  /** 令牌作用域 */
  scope?: string;
}
