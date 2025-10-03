/**
 * 企业级Fastify适配器 - NestJS集成接口
 *
 * 完整替代NestJS官方FastifyAdapter的企业级实现，继承并增强NestJS官方适配器。
 *
 * @description 此适配器是完整替代NestJS官方FastifyAdapter的企业级实现。
 * 继承并增强NestJS官方适配器，无缝集成企业级功能，为应用开发者提供统一的接口。
 * 专为SAAS平台设计，支持多租户架构和微服务架构。
 *
 * ## 业务规则
 *
 * ### 设计定位规则
 * - NestJS集成：完全兼容NestJS生态系统，可直接替换官方FastifyAdapter
 * - 企业级增强：在标准功能基础上，无缝集成企业级功能
 * - 应用接口：面向应用开发者的主要使用接口
 * - 完整替代：100%兼容官方适配器，同时提供企业级增强
 *
 * ### 架构特色规则
 * - 双层架构：继承NestJS官方适配器 + 内置CoreFastifyAdapter企业级功能
 * - 透明集成：企业级功能对应用开发者透明，无需修改现有代码
 * - 优雅降级：企业级功能启动失败时，自动降级到标准模式
 * - 配置驱动：通过配置选项灵活控制企业级功能的启用
 *
 * ### 集成规则
 * - 支持NestJS应用无缝集成
 * - 支持企业级功能透明启用
 * - 支持配置驱动的功能控制
 * - 支持优雅降级和错误处理
 *
 * @example
 * ```typescript
 * // 创建企业级适配器
 * const adapter = new EnterpriseFastifyAdapter({
 *   logger: true,
 *   trustProxy: true,
 *   enterprise: {
 *     enableHealthCheck: true,
 *     enablePerformanceMonitoring: true,
 *     enableMultiTenant: true
 *   }
 * });
 *
 * // 在NestJS应用中使用
 * const app = await NestFactory.create(AppModule, adapter);
 * ```
 */

import { FastifyAdapter } from '@nestjs/platform-fastify';
import { CoreFastifyAdapter } from './core-fastify.adapter';
import { IFastifyEnterpriseConfig } from '../types/fastify.types';
import {
  RateLimitMiddleware,
  IRateLimitConfig,
} from '../middleware/rate-limit.middleware';
import {
  CircuitBreakerMiddleware,
  ICircuitBreakerConfig,
} from '../middleware/circuit-breaker.middleware';
import {
  SecurityMiddleware,
  ISecurityConfig,
} from '../middleware/security.middleware';
import {
  createPerformanceMonitor,
  PerformanceMonitorService,
  IPerformanceMonitorConfig,
} from '../monitoring/performance-monitor.service';

/**
 * 企业级Fastify选项
 */
export interface IEnterpriseFastifyOptions {
  /** 标准Fastify选项 */
  logger?: boolean;
  trustProxy?: boolean;

  /** 企业级功能配置 */
  enterprise?: {
    enableHealthCheck?: boolean;
    enablePerformanceMonitoring?: boolean;
    enableMultiTenant?: boolean;
    tenantHeader?: string;
    corsOptions?: {
      origin?: boolean | string | string[];
      credentials?: boolean;
    };
    logger?: {
      level?: string;
      prettyPrint?: boolean;
      serializers?: Record<string, unknown>;
    };

    // 新增：企业级特性配置
    rateLimit?: (IRateLimitConfig & { enabled?: boolean }) | false;
    circuitBreaker?: (ICircuitBreakerConfig & { enabled?: boolean }) | false;
    security?: (ISecurityConfig & { enabled?: boolean }) | false;
    performance?: (IPerformanceMonitorConfig & { enabled?: boolean }) | false;

    // 优雅关闭
    gracefulShutdown?: {
      enabled?: boolean;
      timeoutMs?: number;
      signals?: string[]; // e.g. ['SIGTERM','SIGINT']
    };
  };
}

/**
 * 企业级Fastify适配器
 *
 * 继承NestJS官方FastifyAdapter，添加完整的企业级功能，支持多租户、监控、健康检查等。
 *
 * @description 此适配器继承NestJS官方FastifyAdapter，添加完整的企业级功能。
 * 支持多租户架构、性能监控、健康检查、CORS配置等企业级功能。
 * 专为SAAS平台设计，支持微服务架构和云原生部署。
 *
 * ## 业务规则
 *
 * ### 继承规则
 * - 完全兼容NestJS官方FastifyAdapter
 * - 支持所有标准Fastify功能
 * - 无缝集成NestJS生态系统
 * - 保持API的向后兼容性
 *
 * ### 企业级功能规则
 * - 支持多租户架构和租户隔离
 * - 支持性能监控和指标收集
 * - 支持健康检查和状态监控
 * - 支持CORS配置和安全策略
 *
 * ### 配置规则
 * - 支持标准Fastify配置选项
 * - 支持企业级功能配置选项
 * - 支持配置验证和错误处理
 * - 支持配置热更新和动态调整
 *
 * @example
 * ```typescript
 * // 创建企业级适配器
 * const adapter = new EnterpriseFastifyAdapter({
 *   logger: true,
 *   trustProxy: true,
 *   enterprise: {
 *     enableHealthCheck: true,
 *     enablePerformanceMonitoring: true,
 *     enableMultiTenant: true
 *   }
 * });
 *
 * // 在NestJS应用中使用
 * const app = await NestFactory.create(AppModule, adapter);
 * ```
 */
export class EnterpriseFastifyAdapter extends FastifyAdapter {
  private readonly enterpriseCore?: CoreFastifyAdapter;
  private readonly enterpriseConfig: NonNullable<
    IEnterpriseFastifyOptions['enterprise']
  >;
  private rateLimitMiddleware?: RateLimitMiddleware;
  private circuitBreakerMiddleware?: CircuitBreakerMiddleware;
  private securityMiddleware?: SecurityMiddleware;
  private perfMonitor?: PerformanceMonitorService;

  constructor(options?: IEnterpriseFastifyOptions) {
    // 提取企业级配置，传递标准配置给父类
    const { enterprise, ...fastifyOptions } = options || {};
    super(fastifyOptions);

    this.enterpriseConfig = enterprise || {};

    // 企业级功能将在异步初始化中创建
    // 因为需要加载配置，而构造函数不能是异步的
  }

  /**
   * 异步初始化企业级功能
   *
   * 基于配置异步初始化企业级功能，包括健康检查、性能监控、多租户支持等。
   *
   * @description 此方法基于配置异步初始化企业级功能。
   * 包括健康检查、性能监控、多租户支持、CORS配置等企业级功能。
   * 支持配置驱动的功能启用和优雅降级。
   *
   * ## 业务规则
   *
   * ### 初始化流程规则
   * - 检查企业级功能是否启用
   * - 创建企业级核心适配器
   * - 注册企业级插件和中间件
   * - 配置企业级功能选项
   *
   * ### 配置验证规则
   * - 验证企业级配置的有效性
   * - 检查必需的配置选项
   * - 验证配置选项的格式和类型
   * - 处理配置错误和异常
   *
   * ### 错误处理规则
   * - 初始化失败时记录详细错误信息
   * - 支持优雅降级到标准模式
   * - 清理已初始化的资源
   * - 抛出明确的异常信息
   *
   * @throws {Error} 当企业级功能初始化失败时抛出
   *
   * @example
   * ```typescript
   * // 初始化企业级功能
   * await adapter.initializeEnterpriseFeatures();
   * console.log('企业级功能已初始化');
   * ```
   */
  async initializeEnterpriseFeatures(): Promise<void> {
    try {
      const enabled = await this.isEnterpriseEnabled();

      if (enabled && !this.enterpriseCore) {
        const enterpriseCore = new CoreFastifyAdapter(
          this.createEnterpriseConfig()
        );

        // 将enterpriseCore赋值给readonly字段需要类型断言
        (this as unknown as { enterpriseCore: unknown }).enterpriseCore =
          enterpriseCore;

        // 注册中间件与监控
        this.registerEnterpriseMiddlewares();
        this.setupGracefulShutdown();

        console.log('✅ 企业级Fastify功能已初始化');
      }
    } catch (error) {
      console.warn(
        '企业级功能初始化失败，使用标准模式:',
        (error as Error).message
      );
    }
  }

  /**
   * 检查是否启用了企业级功能
   *
   * 检查配置中是否启用了任何企业级功能，包括健康检查、性能监控、多租户支持等。
   *
   * @description 此方法检查配置中是否启用了任何企业级功能。
   * 包括健康检查、性能监控、多租户支持等企业级功能。
   * 只要启用了任何一个企业级功能，就返回true。
   *
   * ## 业务规则
   *
   * ### 功能检查规则
   * - 检查健康检查功能是否启用
   * - 检查性能监控功能是否启用
   * - 检查多租户支持功能是否启用
   * - 只要有一个功能启用就返回true
   *
   * ### 配置验证规则
   * - 验证配置选项的有效性
   * - 检查配置选项的布尔值
   * - 处理undefined和null值
   * - 支持默认值处理
   *
   * @returns 是否启用了企业级功能
   *
   * @example
   * ```typescript
   * // 检查企业级功能是否启用
   * const enabled = await adapter.isEnterpriseEnabled();
   * if (enabled) {
   *   console.log('企业级功能已启用');
   * }
   * ```
   */
  private async isEnterpriseEnabled(): Promise<boolean> {
    return !!(
      this.enterpriseConfig.enableHealthCheck ||
      this.enterpriseConfig.enablePerformanceMonitoring ||
      this.enterpriseConfig.enableMultiTenant
    );
  }

  /**
   * 创建企业级配置
   *
   * 基于企业级选项创建企业级配置，包括服务器配置、插件配置、中间件配置等。
   *
   * @description 此方法基于企业级选项创建企业级配置。
   * 包括服务器配置、插件配置、中间件配置、路由配置等。
   * 确保企业级功能能够正确初始化和运行。
   *
   * ## 业务规则
   *
   * ### 配置创建规则
   * - 基于企业级选项创建配置
   * - 设置默认配置值
   * - 合并用户自定义配置
   * - 验证配置的有效性
   *
   * ### 服务器配置规则
   * - 设置默认端口和主机
   * - 支持自定义端口和主机
   * - 支持环境变量配置
   * - 支持配置验证
   *
   * ### 插件配置规则
   * - 支持CORS插件配置
   * - 支持日志插件配置
   * - 支持自定义插件配置
   * - 支持插件依赖管理
   *
   * @returns 企业级配置对象
   *
   * @example
   * ```typescript
   * // 创建企业级配置
   * const config = adapter.createEnterpriseConfig();
   * console.log('企业级配置:', config);
   * ```
   */
  private createEnterpriseConfig(): IFastifyEnterpriseConfig {
    return {
      server: {
        port: 3000, // 默认端口，实际由listen方法覆盖
        host: '0.0.0.0',
      },
      plugins: this.enterpriseConfig.corsOptions
        ? [
            {
              name: 'cors',
              enabled: true,
              priority: 1,
              options: this.enterpriseConfig.corsOptions,
            },
          ]
        : [],
      middleware: this.enterpriseConfig.enableMultiTenant
        ? [
            {
              name: 'tenant',
              enabled: true,
              priority: 1,
              options: {
                tenantHeader:
                  this.enterpriseConfig.tenantHeader || 'X-Tenant-ID',
                validateTenant: true,
              },
            },
          ]
        : [],
      routes: [],
      monitoring: {
        enableMetrics:
          this.enterpriseConfig.enablePerformanceMonitoring || false,
        enableHealthCheck: this.enterpriseConfig.enableHealthCheck || false,
        enablePerformanceMonitoring:
          this.enterpriseConfig.enablePerformanceMonitoring || false,
      },
      security: {
        enableHelmet: false,
        enableCORS: !!this.enterpriseConfig.corsOptions,
        enableRateLimit: false,
      },
      logging: {
        level: 'info' as const,
        prettyPrint: true,
      },
    };
  }

  /**
   * 注册企业级中间件与监控
   */
  private registerEnterpriseMiddlewares(): void {
    const app = this.getInstance() as any;

    // 安全
    if (
      this.enterpriseConfig.security &&
      typeof this.enterpriseConfig.security === 'object'
    ) {
      const { enabled, ...rest } = this.enterpriseConfig.security;
      if (enabled !== false) {
        this.securityMiddleware = new SecurityMiddleware(rest);
        this.securityMiddleware.register(app);
      }
    }

    // 限流
    if (
      this.enterpriseConfig.rateLimit &&
      typeof this.enterpriseConfig.rateLimit === 'object'
    ) {
      const { enabled, ...rest } = this.enterpriseConfig.rateLimit;
      if (enabled !== false) {
        this.rateLimitMiddleware = new RateLimitMiddleware(rest);
        this.rateLimitMiddleware.register(app);
      }
    }

    // 熔断
    if (
      this.enterpriseConfig.circuitBreaker &&
      typeof this.enterpriseConfig.circuitBreaker === 'object'
    ) {
      const { enabled, ...rest } = this.enterpriseConfig.circuitBreaker;
      if (enabled !== false) {
        this.circuitBreakerMiddleware = new CircuitBreakerMiddleware(rest);
        this.circuitBreakerMiddleware.register(app);
      }
    }

    // 性能监控
    if (
      this.enterpriseConfig.performance &&
      typeof this.enterpriseConfig.performance === 'object'
    ) {
      const { enabled, ...rest } = this.enterpriseConfig.performance;
      if (enabled !== false) {
        this.perfMonitor = createPerformanceMonitor(app, rest);
      }
    }
  }

  /**
   * 优雅关闭（可选）
   */
  private setupGracefulShutdown(): void {
    const cfg = this.enterpriseConfig.gracefulShutdown;
    if (!cfg || cfg.enabled === false) return;

    const signals = cfg.signals ?? ['SIGTERM', 'SIGINT'];
    const timeoutMs = cfg.timeoutMs ?? 15_000;

    const handler = async (signal: string) => {
      try {
        console.log(`Received ${signal}, starting graceful shutdown...`);
        const timer = setTimeout(() => {
          console.warn('Graceful shutdown timed out, forcing exit');
          // eslint-disable-next-line no-process-exit
          process.exit(1);
        }, timeoutMs);

        await this.close();
        clearTimeout(timer);
        // eslint-disable-next-line no-process-exit
        process.exit(0);
      } catch (e) {
        console.error('Error during graceful shutdown:', (e as Error).message);
        // eslint-disable-next-line no-process-exit
        process.exit(1);
      }
    };

    signals.forEach((sig) => {
      process.on(sig as NodeJS.Signals, () => handler(sig));
    });
  }

  /**
   * 重写listen方法，添加企业级启动逻辑
   */
  override async listen(
    port: string | number,
    ...args: unknown[]
  ): Promise<unknown> {
    // 启动企业级功能
    if (this.enterpriseCore) {
      try {
        await this.enterpriseCore.start();
        console.log('✅ 企业级Fastify功能已启动');
      } catch (error) {
        console.warn(
          '企业级功能启动失败，继续使用标准模式:',
          (error as Error).message
        );
      }
    }

    // 调用父类listen方法
    return super.listen(port, ...(args as [string, () => void]));
  }

  /**
   * 重写close方法，添加企业级清理逻辑
   */
  override async close(): Promise<undefined> {
    // 停止企业级功能
    if (this.enterpriseCore) {
      try {
        await this.enterpriseCore.stop();
        console.log('✅ 企业级Fastify功能已停止');
      } catch (error) {
        console.warn('企业级功能停止失败:', (error as Error).message);
      }
    }

    // 调用父类close方法
    await super.close();
    return undefined;
  }

  /**
   * 获取企业级健康状态
   */
  async getEnterpriseHealthStatus(): Promise<Record<string, unknown>> {
    if (this.enterpriseCore) {
      try {
        return (await this.enterpriseCore.getHealthStatus()) as unknown as Record<
          string,
          unknown
        >;
      } catch (error) {
        return {
          status: 'error',
          message: (error as Error).message,
        };
      }
    }

    return {
      status: 'standard',
      message: '企业级功能未启用',
    };
  }

  /**
   * 获取企业级性能指标
   */
  async getEnterprisePerformanceMetrics(): Promise<Record<string, unknown>> {
    if (this.enterpriseCore) {
      try {
        return (await this.enterpriseCore.getPerformanceMetrics()) as unknown as Record<
          string,
          unknown
        >;
      } catch (error) {
        return {
          status: 'error',
          message: (error as Error).message,
        };
      }
    }

    return {
      status: 'standard',
      message: '企业级功能未启用',
    };
  }
}
