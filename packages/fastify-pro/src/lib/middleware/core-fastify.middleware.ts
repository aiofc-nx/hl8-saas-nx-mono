/**
 * 企业级Fastify中间件基类
 *
 * 提供中间件生命周期管理、性能监控、错误处理等企业级功能。
 *
 * @description 此基类提供中间件生命周期管理、性能监控、错误处理等企业级功能。
 * 为所有Fastify中间件提供统一的基础功能，支持智能管理和性能监控。
 * 专为SAAS平台设计，支持多租户架构和微服务架构。
 *
 * ## 业务规则
 *
 * ### 设计定位规则
 * - 中间件基类：为所有Fastify中间件提供统一的基础功能
 * - 智能管理：支持路径过滤、方法过滤、优先级排序
 * - 性能监控：中间件性能指标收集和分析
 * - 错误处理：统一的错误处理和恢复机制
 *
 * ### 生命周期规则
 * - 支持中间件注册和卸载
 * - 支持中间件状态管理
 * - 支持中间件健康检查
 * - 支持中间件性能监控
 *
 * ### 性能监控规则
 * - 记录中间件执行时间
 * - 记录中间件成功和失败次数
 * - 记录中间件错误信息
 * - 支持中间件性能分析
 *
 * @example
 * ```typescript
 * // 创建自定义中间件
 * class MyMiddleware extends CoreFastifyMiddleware {
 *   middleware = async (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
 *     // 中间件逻辑
 *   };
 * }
 * 
 * // 注册中间件
 * const middleware = new MyMiddleware({
 *   name: 'my-middleware',
 *   priority: 1,
 *   enabled: true
 * });
 * ```
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  IFastifyMiddleware,
  IFastifyMiddlewareConfig,
  IFastifyMiddlewareStatus,
} from '../types/fastify.types';

/**
 * 企业级Fastify中间件基类
 *
 * 提供中间件生命周期管理和企业级功能，支持性能监控、错误处理等。
 *
 * @description 此基类提供中间件生命周期管理和企业级功能。
 * 支持性能监控、错误处理、状态管理等企业级功能。
 * 专为SAAS平台设计，支持多租户架构和微服务架构。
 *
 * ## 业务规则
 *
 * ### 生命周期管理规则
 * - 支持中间件注册和卸载
 * - 支持中间件状态管理
 * - 支持中间件健康检查
 * - 支持中间件性能监控
 *
 * ### 性能监控规则
 * - 记录中间件执行时间
 * - 记录中间件成功和失败次数
 * - 记录中间件错误信息
 * - 支持中间件性能分析
 *
 * ### 错误处理规则
 * - 统一的错误处理和恢复机制
 * - 支持错误信息记录和分析
 * - 支持错误统计和告警
 * - 支持错误恢复和重试
 *
 * @example
 * ```typescript
 * // 创建自定义中间件
 * class MyMiddleware extends CoreFastifyMiddleware {
 *   middleware = async (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
 *     // 中间件逻辑
 *   };
 * }
 * 
 * // 注册中间件
 * const middleware = new MyMiddleware({
 *   name: 'my-middleware',
 *   priority: 1,
 *   enabled: true
 * });
 * ```
 */
export abstract class CoreFastifyMiddleware implements IFastifyMiddleware {
  public readonly name: string;
  public readonly priority: number;
  public readonly enabled: boolean;
  public readonly config: IFastifyMiddlewareConfig;

  private _isRegistered = false;
  private _registerTime?: Date;
  private _errorCount = 0;
  private _successCount = 0;
  private _totalTime = 0;
  private _lastError?: Error;

  constructor(config: IFastifyMiddlewareConfig) {
    this.name = config.name;
    this.priority = config.priority || 0;
    this.enabled = config.enabled !== false;
    this.config = config;
  }

  /**
   * 中间件函数
   *
   * @description 子类需要实现具体的中间件逻辑
   */
  abstract middleware(
    request: FastifyRequest,
    reply: FastifyReply,
    done: () => void
  ): Promise<void> | void;

  /**
   * 注册中间件
   *
   * @description 注册中间件到Fastify实例
   */
  async register(fastify: FastifyInstance): Promise<void> {
    if (!this.enabled) {
      console.log(`中间件已禁用: ${this.name}`);
      return;
    }

    try {
      // 中间件注册前验证
      await this.validateConfiguration();

      // 创建包装的中间件函数
      const wrappedMiddleware = this.createWrappedMiddleware();

      // 注册中间件
      await this.doRegister(fastify, wrappedMiddleware);

      // 记录中间件状态
      this._isRegistered = true;
      this._registerTime = new Date();

      console.log(`✅ 中间件已注册: ${this.name}`);
    } catch (error) {
      this._lastError = error as Error;
      this._errorCount++;
      console.error(`❌ 中间件注册失败: ${this.name}`, error);
      throw error;
    }
  }

  /**
   * 获取中间件状态
   *
   * @description 获取中间件的详细状态信息
   */
  async getStatus(): Promise<IFastifyMiddlewareStatus> {
    return {
      name: this.name,
      isRegistered: this._isRegistered,
      registerTime: this._registerTime,
      isHealthy: this.isHealthy(),
      error: this._lastError?.message,
      metrics: {
        errorCount: this._errorCount,
        successCount: this._successCount,
        successRate: this.calculateSuccessRate(),
        averageTime: this.calculateAverageTime(),
        totalTime: this._totalTime,
      },
    };
  }

  /**
   * 检查中间件是否健康
   *
   * @description 检查中间件是否正常工作
   */
  private isHealthy(): boolean {
    if (!this.enabled) return false;
    if (this._lastError && this._errorCount > 5) return false;
    return true;
  }

  /**
   * 计算成功率
   */
  private calculateSuccessRate(): number {
    const total = this._errorCount + this._successCount;
    if (total === 0) return 100;
    return (this._successCount / total) * 100;
  }

  /**
   * 计算平均执行时间
   */
  private calculateAverageTime(): number {
    const total = this._errorCount + this._successCount;
    if (total === 0) return 0;
    return this._totalTime / total;
  }

  /**
   * 创建包装的中间件函数
   *
   * @description 添加性能监控和错误处理
   */
  private createWrappedMiddleware() {
    return async (
      request: FastifyRequest,
      reply: FastifyReply,
      done: () => void
    ) => {
      const startTime = Date.now();

      try {
        // 检查路径过滤
        if (!this.shouldProcessRequest(request)) {
          return done();
        }

        // 执行中间件逻辑
        await this.middleware(request, reply, done);

        // 记录成功
        this._successCount++;
        this._totalTime += Date.now() - startTime;
      } catch (error) {
        // 记录错误
        this._errorCount++;
        this._lastError = error as Error;

        // 错误处理
        await this.handleError(error as Error, request, reply);

        // 继续执行或返回错误
        if (this.config.options?.['continueOnError'] !== false) {
          done();
        } else {
          reply.status(500).send({ error: 'Internal Server Error' });
        }
      }
    };
  }

  /**
   * 检查是否应该处理请求
   *
   * @description 根据路径和方法过滤请求
   */
  private shouldProcessRequest(request: FastifyRequest): boolean {
    // 检查路径过滤
    if (this.config.path) {
      const paths = Array.isArray(this.config.path)
        ? this.config.path
        : [this.config.path];
      const matches = paths.some((path) => {
        if (path.includes('*')) {
          const regex = new RegExp(path.replace(/\*/g, '.*'));
          return regex.test(request.url);
        }
        return request.url.startsWith(path);
      });

      if (!matches) return false;
    }

    // 检查方法过滤
    if (this.config.method) {
      const methods = Array.isArray(this.config.method)
        ? this.config.method
        : [this.config.method];
      if (!methods.includes(request.method)) return false;
    }

    return true;
  }

  /**
   * 处理错误
   *
   * @description 子类可以重写此方法实现自定义错误处理
   */
  protected async handleError(
    error: Error,
    request: FastifyRequest,
    _reply: FastifyReply
  ): Promise<void> {
    console.error(`中间件错误 [${this.name}]:`, error);

    // 记录错误到请求上下文
    if (!request.errors) {
      request.errors = [];
    }
    request.errors.push({
      middleware: this.name,
      error: error.message,
      timestamp: new Date(),
    });
  }

  /**
   * 执行中间件注册
   *
   * @description 子类可以重写此方法实现自定义注册逻辑
   */
  protected async doRegister(
    fastify: FastifyInstance,
    middleware: (
      request: FastifyRequest,
      reply: FastifyReply,
      done: () => void
    ) => Promise<void> | void
  ): Promise<void> {
    // 默认使用preHandler钩子
    await fastify.addHook('preHandler', middleware);
  }

  /**
   * 验证配置
   *
   * @description 子类可以重写此方法实现配置验证
   */
  protected async validateConfiguration(): Promise<void> {
    if (!this.name) {
      throw new Error('中间件名称不能为空');
    }
  }
}

/**
 * Fastify中间件错误
 *
 * @description 中间件相关的错误类
 */
export class FastifyMiddlewareError extends Error {
  constructor(
    message: string,
    public readonly middlewareName: string,
    public readonly operation: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'FastifyMiddlewareError';
  }
}
