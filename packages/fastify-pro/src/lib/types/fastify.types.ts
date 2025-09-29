/**
 * Fastify核心类型定义
 *
 * @description 定义Fastify集成的核心类型和接口
 * @since 1.0.0
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

/**
 * Fastify适配器接口
 *
 * @description 定义Fastify适配器的核心功能接口
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
  ) => Promise<any> | any;

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
  options?: Record<string, any>;

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
  options?: Record<string, any>;

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
  options?: Record<string, any>;

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
  metrics?: Record<string, any>;
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
  metrics?: Record<string, any>;
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
    rateLimitOptions?: any;
  };

  /** 日志配置 */
  logging: {
    level: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
    prettyPrint?: boolean;
    redact?: string[];
  };

  /** 多租户配置 */
  multiTenant?: {
    enabled: boolean;
    tenantHeader: string;
    tenantQueryParam: string;
  };
}
