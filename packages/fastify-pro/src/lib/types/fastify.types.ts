/**
 * Fastify核心类型定义
 *
 * 定义Fastify集成的核心类型和接口，包括适配器、插件、中间件、路由等。
 *
 * @description 此文件定义Fastify集成的核心类型和接口。
 * 包括适配器、插件、中间件、路由等核心组件的类型定义。
 * 专为SAAS平台设计，支持多租户架构和微服务架构。
 *
 * ## 业务规则
 *
 * ### 类型定义规则
 * - 所有接口必须包含完整的类型定义
 * - 支持泛型和类型约束
 * - 支持可选属性和默认值
 * - 支持类型继承和扩展
 *
 * ### 接口设计规则
 * - 接口设计遵循单一职责原则
 * - 支持接口继承和组合
 * - 支持接口的向后兼容性
 * - 支持接口的版本管理
 *
 * ### 类型安全规则
 * - 所有类型必须经过TypeScript类型检查
 * - 支持严格的类型约束
 * - 支持类型推导和推断
 * - 支持类型守卫和类型断言
 *
 * @example
 * ```typescript
 * // 使用适配器接口
 * const adapter: IFastifyAdapter = new CoreFastifyAdapter(config);
 *
 * // 使用插件接口
 * const plugin: IFastifyPlugin = new CorsPlugin(options);
 *
 * // 使用中间件接口
 * const middleware: IFastifyMiddleware = new TenantExtractionMiddleware(config);
 * ```
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// 重新导出 Fastify 核心类型
export { FastifyInstance, FastifyRequest, FastifyReply };

// 扩展 FastifyRequest 类型以包含用户信息
declare module 'fastify' {
  interface FastifyRequest {
    user?: any;
    tenantId?: string;
    tenantContext?: {
      tenantId: string;
      organizationId?: string;
      departmentId?: string;
      userId?: string;
      isolationLevel?: 'tenant' | 'organization' | 'department' | 'user';
      metadata?: Record<string, unknown>;
      userRoles?: string[];
      userPermissions?: string[];
    };
  }
}

/**
 * Fastify适配器接口
 *
 * 定义Fastify适配器的核心功能接口，包括服务器管理、插件管理、中间件管理等。
 *
 * @description 此接口定义Fastify适配器的核心功能接口。
 * 包括服务器管理、插件管理、中间件管理、路由管理等核心功能。
 * 专为SAAS平台设计，支持多租户架构和微服务架构。
 *
 * ## 业务规则
 *
 * ### 服务器管理规则
 * - 支持服务器启动和停止
 * - 支持健康状态检查
 * - 支持性能指标收集
 * - 支持优雅关闭和资源清理
 *
 * ### 插件管理规则
 * - 支持插件注册和卸载
 * - 支持插件生命周期管理
 * - 支持插件健康检查
 * - 支持插件依赖管理
 *
 * ### 中间件管理规则
 * - 支持中间件注册和卸载
 * - 支持中间件优先级排序
 * - 支持中间件错误处理
 * - 支持中间件性能监控
 *
 * @example
 * ```typescript
 * // 实现适配器接口
 * class MyAdapter implements IFastifyAdapter {
 *   async start(): Promise<void> {
 *     // 启动服务器
 *   }
 *
 *   async stop(): Promise<void> {
 *     // 停止服务器
 *   }
 * }
 * ```
 */
export interface IFastifyAdapter {
  /** 启动服务器 */
  start(): Promise<void>;

  /** 停止服务器 */
  stop(): Promise<void>;

  /** 获取健康状态 */
  getHealthStatus(): Promise<Record<string, unknown>>;

  /** 获取性能指标 */
  getPerformanceMetrics(): Promise<Record<string, unknown>>;

  /** 注册插件 */
  registerPlugin(plugin: IFastifyPlugin): Promise<void>;

  /** 注册中间件 */
  registerMiddleware(middleware: IFastifyMiddleware): Promise<void>;

  /** 注册路由 */
  registerRoute(route: IFastifyRoute): Promise<void>;
}

/**
 * Fastify插件接口
 *
 * @description 定义Fastify插件的生命周期和功能
 */
export interface IFastifyPlugin {
  /** 插件名称 */
  readonly name: string;

  /** 插件版本 */
  readonly version: string;

  /** 插件优先级 */
  readonly priority: number;

  /** 是否启用 */
  readonly enabled: boolean;

  /** 插件配置 */
  readonly config: IFastifyPluginConfig;

  /** 注册插件 */
  register(fastify: FastifyInstance): Promise<void>;

  /** 卸载插件 */
  unregister(fastify: FastifyInstance): Promise<void>;

  /** 获取插件状态 */
  getStatus(): Promise<IFastifyPluginStatus>;

  /** 健康检查 */
  healthCheck(): Promise<boolean>;
}

/**
 * Fastify中间件接口
 *
 * @description 定义Fastify中间件的功能和配置
 */
export interface IFastifyMiddleware {
  /** 中间件名称 */
  readonly name: string;

  /** 中间件优先级 */
  readonly priority: number;

  /** 是否启用 */
  readonly enabled: boolean;

  /** 中间件配置 */
  readonly config: IFastifyMiddlewareConfig;

  /** 中间件函数 */
  readonly middleware: (
    request: FastifyRequest,
    reply: FastifyReply,
    done: () => void
  ) => Promise<void> | void;

  /** 注册中间件 */
  register(fastify: FastifyInstance): Promise<void>;

  /** 获取中间件状态 */
  getStatus(): Promise<IFastifyMiddlewareStatus>;
}

/**
 * Fastify路由接口
 *
 * @description 定义Fastify路由的配置和功能
 */
export interface IFastifyRoute {
  /** 路由名称 */
  readonly name: string;

  /** 路由路径 */
  readonly path: string;

  /** HTTP方法 */
  readonly method: string | string[];

  /** 路由处理器 */
  readonly handler: (
    request: FastifyRequest,
    reply: FastifyReply
  ) => Promise<unknown> | unknown;

  /** 路由配置 */
  readonly config: IFastifyRouteConfig;

  /** 注册路由 */
  register(fastify: FastifyInstance): Promise<void>;
}

/**
 * Fastify插件配置
 */
export interface IFastifyPluginConfig {
  /** 插件名称 */
  name: string;

  /** 插件选项 */
  options?: Record<string, unknown>;

  /** 插件优先级 */
  priority?: number;

  /** 是否启用 */
  enabled?: boolean;

  /** 依赖插件 */
  dependencies?: string[];

  /** 插件描述 */
  description?: string;
}

/**
 * Fastify中间件配置
 */
export interface IFastifyMiddlewareConfig {
  /** 中间件名称 */
  name: string;

  /** 中间件优先级 */
  priority?: number;

  /** 是否启用 */
  enabled?: boolean;

  /** 路径过滤 */
  path?: string | string[];

  /** HTTP方法过滤 */
  method?: string | string[];

  /** 中间件选项 */
  options?: Record<string, unknown>;

  /** 中间件描述 */
  description?: string;
}

/**
 * Fastify路由配置
 */
export interface IFastifyRouteConfig {
  /** 路由名称 */
  name: string;

  /** 路由描述 */
  description?: string;

  /** 路由标签 */
  tags?: string[];

  /** 路由选项 */
  options?: Record<string, unknown>;

  /** 路由前缀 */
  prefix?: string;

  /** 路由版本 */
  version?: string;
}

/**
 * Fastify插件状态
 */
export interface IFastifyPluginStatus {
  /** 插件名称 */
  name: string;

  /** 是否已注册 */
  isRegistered: boolean;

  /** 注册时间 */
  registerTime?: Date;

  /** 卸载时间 */
  unregisterTime?: Date;

  /** 健康状态 */
  isHealthy: boolean;

  /** 错误信息 */
  error?: string;

  /** 性能指标 */
  metrics?: Record<string, unknown>;
}

/**
 * Fastify中间件状态
 */
export interface IFastifyMiddlewareStatus {
  /** 中间件名称 */
  name: string;

  /** 是否已注册 */
  isRegistered: boolean;

  /** 注册时间 */
  registerTime?: Date;

  /** 健康状态 */
  isHealthy: boolean;

  /** 错误信息 */
  error?: string;

  /** 性能指标 */
  metrics?: Record<string, unknown>;
}

/**
 * Fastify服务器配置
 */
export interface IFastifyServerConfig {
  /** 服务器端口 */
  port: number;

  /** 服务器主机 */
  host: string;

  /** HTTPS配置 */
  https?: {
    key: string;
    cert: string;
  };

  /** 保持连接超时 */
  keepAliveTimeout?: number;

  /** 请求头超时 */
  headersTimeout?: number;

  /** 请求体限制 */
  bodyLimit?: number;
}

/**
 * Fastify企业级配置
 */
export interface IFastifyEnterpriseConfig {
  /** 服务器配置 */
  server: IFastifyServerConfig;

  /** 插件配置 */
  plugins: IFastifyPluginConfig[];

  /** 中间件配置 */
  middleware: IFastifyMiddlewareConfig[];

  /** 路由配置 */
  routes: IFastifyRouteConfig[];

  /** 监控配置 */
  monitoring: {
    enableMetrics: boolean;
    enableHealthCheck: boolean;
    enablePerformanceMonitoring: boolean;
    metricsInterval?: number;
  };

  /** 安全配置 */
  security: {
    enableHelmet: boolean;
    enableCORS: boolean;
    enableRateLimit: boolean;
    rateLimitOptions?: {
      max?: number;
      timeWindow?: string | number;
      skipOnError?: boolean;
      keyGenerator?: (request: unknown) => string;
      errorResponseBuilder?: (request: unknown, context: unknown) => unknown;
    };
  };

  /** 日志配置 */
  logging: {
    level: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
    prettyPrint?: boolean;
    redact?: string[];
  };

  /** 租户提取配置 */
  tenantExtraction?: {
    enabled: boolean;
    tenantHeader: string;
    tenantQueryParam: string;
  };
}
