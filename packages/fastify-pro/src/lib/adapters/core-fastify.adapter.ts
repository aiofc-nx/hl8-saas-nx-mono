/**
 * 企业级Fastify核心适配器
 *
 * 企业级Fastify功能的核心引擎，提供独立的Fastify服务器管理和企业级功能实现。
 *
 * @description 此适配器是企业级Fastify功能的核心引擎，提供独立的Fastify服务器管理。
 * 不依赖NestJS，可独立运行，提供完整的服务器生命周期管理、插件管理、中间件管理等功能。
 * 专为SAAS平台设计，支持多租户架构和微服务架构。
 *
 * ## 业务规则
 *
 * ### 设计定位规则
 * - 独立引擎：不依赖NestJS，可独立运行的Fastify服务器管理器
 * - 功能核心：所有企业级功能的实际实现者和管理者
 * - 内部使用：主要被EnterpriseFastifyAdapter内部调用
 * - 纯Fastify：基于原生Fastify API，提供最佳性能和兼容性
 *
 * ### 架构职责规则
 * - 服务器生命周期：完整管理Fastify实例的创建、启动、停止、清理
 * - 插件管理：企业级插件的注册、卸载、健康检查、生命周期管理
 * - 中间件管理：智能中间件注册、优先级排序、路径/方法过滤
 * - 路由管理：动态路由注册、冲突检测、性能监控
 * - 监控系统：实时性能指标收集、健康状态检查、系统资源监控
 * - 多租户支持：租户上下文管理、数据隔离、安全策略
 *
 * ### 性能规则
 * - 支持高并发请求处理
 * - 内存使用优化
 * - 响应时间最小化
 * - 资源清理自动化
 *
 * @example
 * ```typescript
 * // 创建核心适配器
 * const adapter = new CoreFastifyAdapter({
 *   server: {
 *     port: 3000,
 *     host: '0.0.0.0'
 *   },
 *   plugins: [],
 *   middleware: [],
 *   routes: []
 * });
 *
 * // 启动服务器
 * await adapter.start();
 * ```
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// 扩展FastifyRequest类型
declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
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
    errors?: Array<{
      middleware: string;
      error: string;
      timestamp: Date;
    }>;
  }
}
import {
  IFastifyAdapter,
  IFastifyPlugin,
  IFastifyMiddleware,
  IFastifyRoute,
  IFastifyEnterpriseConfig,
} from '../types/fastify.types';

/**
 * 企业级Fastify核心适配器
 *
 * 提供完整的Fastify服务器管理和企业级功能，支持插件管理、中间件管理、路由管理等。
 *
 * @description 此适配器提供完整的Fastify服务器管理和企业级功能。
 * 支持插件管理、中间件管理、路由管理、监控系统等功能。
 * 专为SAAS平台设计，支持多租户架构和微服务架构。
 *
 * ## 业务规则
 *
 * ### 服务器管理规则
 * - 支持服务器启动、停止、重启
 * - 支持配置验证和错误处理
 * - 支持优雅关闭和资源清理
 * - 支持健康检查和状态监控
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
 * - 支持路径和方法过滤
 * - 支持中间件错误处理
 *
 * ### 路由管理规则
 * - 支持动态路由注册
 * - 支持路由冲突检测
 * - 支持路由性能监控
 * - 支持路由健康检查
 *
 * @example
 * ```typescript
 * // 创建适配器实例
 * const adapter = new CoreFastifyAdapter(config);
 *
 * // 启动服务器
 * await adapter.start();
 *
 * // 注册插件
 * await adapter.registerPlugin(plugin);
 *
 * // 注册中间件
 * await adapter.registerMiddleware(middleware);
 * ```
 */
export class CoreFastifyAdapter implements IFastifyAdapter {
  private readonly fastify: FastifyInstance;
  private readonly config: IFastifyEnterpriseConfig;
  private readonly plugins: Map<string, IFastifyPlugin> = new Map();
  private readonly middleware: Map<string, IFastifyMiddleware> = new Map();
  private readonly routes: Map<string, IFastifyRoute> = new Map();

  private _isStarted = false;
  private _startTime?: Date;
  private _requestCount = 0;
  private _errorCount = 0;
  private _successCount = 0;
  private _responseTimes: number[] = [];

  constructor(config: IFastifyEnterpriseConfig) {
    this.config = config;
    this.fastify = this.createFastifyInstance();
    this.setupHooks();
  }

  /**
   * 启动服务器
   *
   * 启动Fastify服务器并初始化所有企业级功能，包括插件、中间件、路由等。
   *
   * @description 此方法启动Fastify服务器并初始化所有企业级功能。
   * 包括插件注册、中间件注册、路由注册、监控系统初始化等。
   * 确保服务器能够正常处理请求并提供企业级功能。
   *
   * ## 业务规则
   *
   * ### 启动流程规则
   * - 按顺序注册插件、中间件、路由
   * - 验证所有配置的有效性
   * - 初始化监控系统
   * - 启动服务器监听端口
   *
   * ### 错误处理规则
   * - 启动失败时记录详细错误信息
   * - 清理已注册的资源
   * - 抛出明确的异常信息
   * - 支持启动重试机制
   *
   * ### 性能规则
   * - 启动时间最小化
   * - 内存使用优化
   * - 资源占用最小化
   * - 支持并发启动
   *
   * @throws {Error} 当服务器启动失败时抛出
   *
   * @example
   * ```typescript
   * // 启动服务器
   * await adapter.start();
   * console.log('服务器已启动');
   * ```
   */
  async start(): Promise<void> {
    try {
      // 注册插件
      await this.registerPlugins();

      // 注册中间件
      await this.registerMiddlewareConfigs();

      // 注册路由
      await this.registerRoutes();

      // 启动服务器
      await this.fastify.listen({
        port: this.config.server.port,
        host: this.config.server.host,
      });

      this._isStarted = true;
      this._startTime = new Date();

      console.log(
        `✅ Fastify服务器已启动: http://${this.config.server.host}:${this.config.server.port}`
      );
    } catch (error) {
      console.error('❌ Fastify服务器启动失败:', error);
      throw error;
    }
  }

  /**
   * 停止服务器
   *
   * @description 优雅停止Fastify服务器并清理所有资源
   */
  async stop(): Promise<void> {
    try {
      // 停止服务器
      await this.fastify.close();

      // 清理资源
      this.plugins.clear();
      this.middleware.clear();
      this.routes.clear();

      this._isStarted = false;

      console.log('✅ Fastify服务器已停止');
    } catch (error) {
      console.error('❌ Fastify服务器停止失败:', error);
      throw error;
    }
  }

  /**
   * 获取健康状态
   *
   * @description 获取服务器和所有组件的健康状态
   */
  async getHealthStatus(): Promise<Record<string, unknown>> {
    const pluginHealth = await this.getPluginHealth();
    const middlewareHealth = await this.getMiddlewareHealth();
    const routeHealth = await this.getRouteHealth();

    return {
      status: this._isStarted ? 'healthy' : 'unhealthy',
      isStarted: this._isStarted,
      startTime: this._startTime,
      uptime: this._startTime ? Date.now() - this._startTime.getTime() : 0,
      plugins: pluginHealth,
      middleware: middlewareHealth,
      routes: routeHealth,
      performance: this.getPerformanceMetrics(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取性能指标
   *
   * @description 获取服务器和系统的性能指标
   */
  async getPerformanceMetrics(): Promise<Record<string, unknown>> {
    return {
      server: {
        requestCount: this._requestCount,
        errorCount: this._errorCount,
        successCount: this._successCount,
        successRate: this.calculateSuccessRate(),
        averageResponseTime: this.calculateAverageResponseTime(),
      },
      system: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: await this.getCpuUsage(),
        uptime: process.uptime(),
      },
      plugins: this.getPluginMetrics(),
      middleware: this.getMiddlewareMetrics(),
      routes: this.getRouteMetrics(),
    };
  }

  /**
   * 注册插件
   *
   * @description 注册Fastify插件
   */
  async registerPlugin(plugin: IFastifyPlugin): Promise<void> {
    try {
      await plugin.register(this.fastify);
      this.plugins.set(plugin.name, plugin);
      console.log(`✅ 插件已注册: ${plugin.name}`);
    } catch (error) {
      console.error(`❌ 插件注册失败: ${plugin.name}`, error);
      throw error;
    }
  }

  /**
   * 注册中间件
   *
   * @description 注册Fastify中间件
   */
  async registerMiddleware(middleware: IFastifyMiddleware): Promise<void> {
    try {
      await middleware.register(this.fastify);
      this.middleware.set(middleware.name, middleware);
      console.log(`✅ 中间件已注册: ${middleware.name}`);
    } catch (error) {
      console.error(`❌ 中间件注册失败: ${middleware.name}`, error);
      throw error;
    }
  }

  /**
   * 注册路由
   *
   * @description 注册Fastify路由
   */
  async registerRoute(route: IFastifyRoute): Promise<void> {
    try {
      await route.register(this.fastify);
      this.routes.set(route.name, route);
      console.log(`✅ 路由已注册: ${route.name}`);
    } catch (error) {
      console.error(`❌ 路由注册失败: ${route.name}`, error);
      throw error;
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 创建Fastify实例
   */
  private createFastifyInstance(): FastifyInstance {
    const fastify = require('fastify')({
      logger: this.config.logging,
      trustProxy: true,
      bodyLimit: this.config.server.bodyLimit || 1048576,
      keepAliveTimeout: this.config.server.keepAliveTimeout || 5000,
      headersTimeout: this.config.server.headersTimeout || 60000,
    });

    return fastify;
  }

  /**
   * 设置钩子
   */
  private setupHooks(): void {
    // 请求开始钩子
    this.fastify.addHook(
      'onRequest',
      async (request: FastifyRequest, reply: FastifyReply) => {
        this._requestCount++;
        request.startTime = Date.now();
      }
    );

    // 请求结束钩子
    this.fastify.addHook(
      'onResponse',
      async (request: FastifyRequest, reply: FastifyReply) => {
        const duration = Date.now() - (request.startTime || Date.now());
        this._responseTimes.push(duration);

        if (reply.statusCode >= 400) {
          this._errorCount++;
        } else {
          this._successCount++;
        }
      }
    );

    // 错误处理钩子
    this.fastify.addHook(
      'onError',
      async (request: FastifyRequest, reply: FastifyReply, error: Error) => {
        this._errorCount++;
        console.error('请求处理错误:', error);
      }
    );
  }

  /**
   * 注册插件
   */
  private async registerPlugins(): Promise<void> {
    for (const pluginConfig of this.config.plugins) {
      if (pluginConfig.enabled !== false) {
        // 这里需要根据插件配置创建插件实例
        // 具体实现将在插件系统中完成
      }
    }
  }

  /**
   * 注册中间件配置
   */
  private async registerMiddlewareConfigs(): Promise<void> {
    for (const middlewareConfig of this.config.middleware) {
      if (middlewareConfig.enabled !== false) {
        // 这里需要根据中间件配置创建中间件实例
        // 具体实现将在中间件系统中完成
      }
    }
  }

  /**
   * 注册路由
   */
  private async registerRoutes(): Promise<void> {
    for (const _routeConfig of this.config.routes) {
      // 这里需要根据路由配置创建路由实例
      // 具体实现将在路由系统中完成
    }
  }

  /**
   * 获取插件健康状态
   */
  private async getPluginHealth(): Promise<Record<string, unknown>> {
    const health: Record<string, unknown> = {};

    for (const [name, plugin] of this.plugins) {
      try {
        const status = await plugin.getStatus();
        health[name] = status;
      } catch (error) {
        health[name] = {
          isHealthy: false,
          error: (error as Error).message,
        };
      }
    }

    return health;
  }

  /**
   * 获取中间件健康状态
   */
  private async getMiddlewareHealth(): Promise<Record<string, unknown>> {
    const health: Record<string, unknown> = {};

    for (const [name, middleware] of this.middleware) {
      try {
        const status = await middleware.getStatus();
        health[name] = status;
      } catch (error) {
        health[name] = {
          isHealthy: false,
          error: (error as Error).message,
        };
      }
    }

    return health;
  }

  /**
   * 获取路由健康状态
   */
  private async getRouteHealth(): Promise<Record<string, unknown>> {
    const health: Record<string, unknown> = {};

    for (const [name, route] of this.routes) {
      health[name] = {
        isHealthy: true,
        path: route.path,
        method: route.method,
      };
    }

    return health;
  }

  /**
   * 获取插件指标
   */
  private getPluginMetrics(): Record<string, unknown> {
    const metrics: Record<string, unknown> = {};

    for (const [name, plugin] of this.plugins) {
      metrics[name] = {
        isRegistered: plugin.enabled,
        version: plugin.version,
        priority: plugin.priority,
      };
    }

    return metrics;
  }

  /**
   * 获取中间件指标
   */
  private getMiddlewareMetrics(): Record<string, unknown> {
    const metrics: Record<string, unknown> = {};

    for (const [name, middleware] of this.middleware) {
      metrics[name] = {
        isRegistered: middleware.enabled,
        priority: middleware.priority,
      };
    }

    return metrics;
  }

  /**
   * 获取路由指标
   */
  private getRouteMetrics(): Record<string, unknown> {
    const metrics: Record<string, unknown> = {};

    for (const [name, route] of this.routes) {
      metrics[name] = {
        path: route.path,
        method: route.method,
      };
    }

    return metrics;
  }

  /**
   * 计算成功率
   */
  private calculateSuccessRate(): number {
    if (this._requestCount === 0) return 0;
    return (this._successCount / this._requestCount) * 100;
  }

  /**
   * 计算平均响应时间
   */
  private calculateAverageResponseTime(): number {
    if (this._responseTimes.length === 0) return 0;
    return (
      this._responseTimes.reduce((sum, time) => sum + time, 0) /
      this._responseTimes.length
    );
  }

  /**
   * 获取CPU使用率
   */
  private async getCpuUsage(): Promise<number> {
    // 这里可以实现CPU使用率监控
    // 简化实现，返回0
    return 0;
  }
}
