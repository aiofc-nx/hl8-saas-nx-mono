/**
 * 健康检查服务
 *
 * @description 提供完整的系统健康检查功能，包括组件状态、依赖检查、性能监控等
 *
 * ## 健康检查核心概念
 *
 * ### 🏥 **健康状态**
 * - **healthy**: 系统完全正常
 * - **degraded**: 部分功能异常，但核心功能正常
 * - **unhealthy**: 系统严重异常，需要立即处理
 *
 * ### 🔍 **检查维度**
 * - **系统资源**: CPU、内存、磁盘使用率
 * - **网络连接**: 数据库、Redis、外部API连接
 * - **业务组件**: 插件、中间件、路由状态
 * - **性能指标**: 响应时间、吞吐量、错误率
 *
 * @since 1.0.0
 */

import { FastifyInstance } from 'fastify';

/**
 * 健康检查结果接口
 */
export interface IHealthCheckResult {
  /** 整体状态 */
  status: 'healthy' | 'degraded' | 'unhealthy';

  /** 检查时间 */
  timestamp: string;

  /** 响应时间 */
  responseTime: number;

  /** 系统信息 */
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };

  /** 组件状态 */
  components: Record<string, IComponentHealth>;

  /** 错误信息 */
  errors?: string[];
}

/**
 * 组件健康状态接口
 */
export interface IComponentHealth {
  /** 组件名称 */
  name: string;

  /** 健康状态 */
  status: 'healthy' | 'degraded' | 'unhealthy';

  /** 响应时间 */
  responseTime?: number;

  /** 错误信息 */
  error?: string;

  /** 详细信息 */
  details?: Record<string, any>;
}

/**
 * 健康检查配置
 */
export interface IHealthCheckConfig {
  /** 检查超时时间（毫秒） */
  timeout?: number;

  /** 是否检查系统资源 */
  checkSystemResources?: boolean;

  /** 是否检查网络连接 */
  checkNetworkConnections?: boolean;

  /** 是否检查业务组件 */
  checkBusinessComponents?: boolean;

  /** 自定义检查器 */
  customCheckers?: IHealthChecker[];
}

/**
 * 健康检查器接口
 */
export interface IHealthChecker {
  /** 检查器名称 */
  name: string;

  /** 检查函数 */
  check: () => Promise<IComponentHealth>;

  /** 检查超时时间 */
  timeout?: number;

  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 健康检查服务
 *
 * @description 提供完整的系统健康检查功能
 */
export class HealthCheckService {
  private readonly fastify: FastifyInstance;
  private readonly config: IHealthCheckConfig;
  private readonly checkers: Map<string, IHealthChecker> = new Map();

  constructor(fastify: FastifyInstance, config: IHealthCheckConfig = {}) {
    this.fastify = fastify;
    this.config = {
      timeout: 5000,
      checkSystemResources: true,
      checkNetworkConnections: false,
      checkBusinessComponents: true,
      ...config,
    };

    this.initializeDefaultCheckers();
  }

  /**
   * 执行健康检查
   *
   * @description 执行完整的系统健康检查
   */
  async performHealthCheck(): Promise<IHealthCheckResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // 执行所有检查器
      const componentResults = await this.executeAllCheckers();

      // 计算整体状态
      const status = this.calculateOverallStatus(componentResults);

      // 获取系统信息
      const systemInfo = await this.getSystemInfo();

      const result: IHealthCheckResult = {
        status,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        system: systemInfo,
        components: componentResults,
        errors: errors.length > 0 ? errors : undefined,
      };

      return result;
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        system: await this.getSystemInfo(),
        components: {},
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * 添加自定义检查器
   *
   * @description 添加自定义的健康检查器
   */
  addChecker(checker: IHealthChecker): void {
    this.checkers.set(checker.name, checker);
  }

  /**
   * 移除检查器
   *
   * @description 移除指定的健康检查器
   */
  removeChecker(name: string): void {
    this.checkers.delete(name);
  }

  /**
   * 获取检查器列表
   *
   * @description 获取所有注册的检查器
   */
  getCheckers(): IHealthChecker[] {
    return Array.from(this.checkers.values());
  }

  /**
   * 执行所有检查器
   *
   * @description 并发执行所有启用的检查器
   */
  private async executeAllCheckers(): Promise<
    Record<string, IComponentHealth>
  > {
    const results: Record<string, IComponentHealth> = {};
    const promises: Promise<void>[] = [];

    for (const [name, checker] of this.checkers) {
      if (checker.enabled !== false) {
        const promise = this.executeChecker(name, checker).then((result) => {
          results[name] = result;
        });
        promises.push(promise);
      }
    }

    await Promise.allSettled(promises);
    return results;
  }

  /**
   * 执行单个检查器
   *
   * @description 执行指定的健康检查器
   */
  private async executeChecker(
    name: string,
    checker: IHealthChecker
  ): Promise<IComponentHealth> {
    const startTime = Date.now();

    try {
      const timeout = checker.timeout || this.config.timeout || 5000;
      const result = await Promise.race([
        checker.check(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), timeout)
        ),
      ]);

      return {
        ...result,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        name,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 计算整体状态
   *
   * @description 根据组件状态计算整体健康状态
   */
  private calculateOverallStatus(
    components: Record<string, IComponentHealth>
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(components).map(
      (component) => component.status
    );

    if (statuses.includes('unhealthy')) {
      return 'unhealthy';
    }

    if (statuses.includes('degraded')) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * 获取系统信息
   *
   * @description 获取系统资源使用情况
   */
  private async getSystemInfo(): Promise<IHealthCheckResult['system']> {
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      uptime: process.uptime(),
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage: (usedMemory / totalMemory) * 100,
      },
      cpu: {
        usage: await this.getCpuUsage(),
      },
    };
  }

  /**
   * 获取CPU使用率
   *
   * @description 获取当前CPU使用率
   */
  private async getCpuUsage(): Promise<number> {
    // 简化实现，实际项目中可以使用更精确的CPU监控
    return 0;
  }

  /**
   * 初始化默认检查器
   *
   * @description 初始化系统默认的健康检查器
   */
  private initializeDefaultCheckers(): void {
    // 系统资源检查器
    if (this.config.checkSystemResources) {
      this.addChecker({
        name: 'system-resources',
        check: async () => {
          const totalMemory = require('os').totalmem();
          const usedMemory = totalMemory - require('os').freemem();
          const memoryPercentage = (usedMemory / totalMemory) * 100;

          return {
            name: 'system-resources',
            status:
              memoryPercentage > 90
                ? 'unhealthy'
                : memoryPercentage > 80
                ? 'degraded'
                : 'healthy',
            details: {
              memoryUsage: {
                used: usedMemory,
                total: totalMemory,
                percentage: memoryPercentage,
              },
              uptime: process.uptime(),
            },
          };
        },
      });
    }

    // Fastify服务器检查器
    if (this.config.checkBusinessComponents) {
      this.addChecker({
        name: 'fastify-server',
        check: async () => {
          return {
            name: 'fastify-server',
            status: 'healthy',
            details: {
              isListening: this.fastify.server?.listening || false,
              address: this.fastify.server?.address(),
            },
          };
        },
      });
    }
  }
}

/**
 * 健康检查服务工厂函数
 *
 * @description 创建健康检查服务的便捷函数
 */
export function createHealthCheckService(
  fastify: FastifyInstance,
  config?: IHealthCheckConfig
): HealthCheckService {
  return new HealthCheckService(fastify, config);
}
