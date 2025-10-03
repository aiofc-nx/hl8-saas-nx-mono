/**
 * 熔断器中间件
 *
 * 基于熔断器模式实现的服务保护中间件，防止级联故障和系统过载。
 *
 * @description 此中间件基于熔断器模式实现服务保护功能。
 * 支持多种熔断策略、自动恢复、监控统计等企业级功能。
 * 专为SAAS平台设计，支持微服务架构和分布式系统。
 *
 * ## 业务规则
 *
 * ### 熔断器状态规则
 * - CLOSED: 正常状态，请求正常通过
 * - OPEN: 熔断状态，请求直接拒绝
 * - HALF_OPEN: 半开状态，允许部分请求通过进行测试
 *
 * ### 状态转换规则
 * - CLOSED → OPEN: 失败率超过阈值或连续失败次数超过阈值
 * - OPEN → HALF_OPEN: 熔断时间到期，进入半开状态
 * - HALF_OPEN → CLOSED: 测试请求成功，恢复正常
 * - HALF_OPEN → OPEN: 测试请求失败，重新熔断
 *
 * ### 监控规则
 * - 记录请求总数、成功数、失败数
 * - 计算失败率和平均响应时间
 * - 支持自定义监控指标
 * - 支持监控数据导出
 *
 * @example
 * ```typescript
 * // 配置熔断器中间件
 * const circuitBreaker = new CircuitBreakerMiddleware({
 *   failureThreshold: 5,        // 失败阈值
 *   timeout: 60000,            // 熔断时间
 *   resetTimeout: 30000,       // 重置时间
 *   monitoringPeriod: 10000,   // 监控周期
 *   volumeThreshold: 10        // 最小请求数
 * });
 *
 * // 注册熔断器中间件
 * fastify.register(circuitBreaker);
 * ```
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

/**
 * 熔断器状态枚举
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * 熔断器配置接口
 */
export interface ICircuitBreakerConfig {
  /** 失败阈值 */
  failureThreshold: number;

  /** 熔断超时时间（毫秒） */
  timeout: number;

  /** 重置超时时间（毫秒） */
  resetTimeout: number;

  /** 监控周期（毫秒） */
  monitoringPeriod: number;

  /** 最小请求数阈值 */
  volumeThreshold: number;

  /** 失败率阈值（0-1） */
  failureRateThreshold?: number;

  /** 是否启用自动恢复 */
  enableAutoRecovery?: boolean;

  /** 半开状态允许的请求数 */
  halfOpenMaxRequests?: number;

  /** 熔断器名称 */
  name?: string;

  /** 自定义键生成器 */
  keyGenerator?: (request: FastifyRequest) => string;

  /** 熔断响应配置 */
  responseConfig?: {
    statusCode?: number;
    message?: string;
    headers?: Record<string, string>;
  };

  /** 监控回调 */
  onStateChange?: (
    state: CircuitBreakerState,
    stats: ICircuitBreakerStats
  ) => void;
}

/**
 * 熔断器统计信息接口
 */
export interface ICircuitBreakerStats {
  /** 请求总数 */
  totalRequests: number;

  /** 成功请求数 */
  successfulRequests: number;

  /** 失败请求数 */
  failedRequests: number;

  /** 失败率 */
  failureRate: number;

  /** 平均响应时间 */
  averageResponseTime: number;

  /** 当前状态 */
  state: CircuitBreakerState;

  /** 最后状态变更时间 */
  lastStateChange: number;

  /** 连续失败次数 */
  consecutiveFailures: number;
}

/**
 * 熔断器中间件类
 *
 * @description 基于熔断器模式的服务保护中间件
 */
export class CircuitBreakerMiddleware {
  private readonly config: ICircuitBreakerConfig;
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private stats: ICircuitBreakerStats;
  private lastFailureTime = 0;
  private halfOpenRequests = 0;
  private monitoringTimer?: NodeJS.Timeout;

  constructor(config: ICircuitBreakerConfig) {
    this.config = {
      failureRateThreshold: 0.5,
      enableAutoRecovery: true,
      halfOpenMaxRequests: 1,
      name: 'default',
      responseConfig: {
        statusCode: 503,
        message: 'Service Unavailable',
        headers: {
          'X-Circuit-Breaker-State': 'OPEN',
        },
      },
      ...config,
    };

    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      failureRate: 0,
      averageResponseTime: 0,
      state: this.state,
      lastStateChange: Date.now(),
      consecutiveFailures: 0,
    };

    this.startMonitoring();
  }

  /**
   * 注册熔断器中间件
   *
   * @description 将熔断器中间件注册到Fastify实例
   */
  register(fastify: FastifyInstance): void {
    fastify.addHook(
      'preHandler',
      async (request: FastifyRequest, reply: FastifyReply) => {
        if (!this.allowRequest()) {
          this.sendCircuitBreakerResponse(reply);
          return;
        }

        // 记录请求开始时间
        (request as unknown as { circuitBreakerStartTime: number }).circuitBreakerStartTime = Date.now();
      }
    );

    fastify.addHook(
      'onResponse',
      async (request: FastifyRequest, reply: FastifyReply) => {
        const startTime = (request as unknown as { circuitBreakerStartTime: number }).circuitBreakerStartTime;
        if (startTime) {
          const responseTime = Date.now() - startTime;
          this.recordRequest(reply.statusCode < 400, responseTime);
        }
      }
    );

    fastify.addHook(
      'onError',
      async (request: FastifyRequest, _reply: FastifyReply, _error: Error) => {
        const startTime = (request as unknown as { circuitBreakerStartTime: number }).circuitBreakerStartTime;
        if (startTime) {
          const responseTime = Date.now() - startTime;
          this.recordRequest(false, responseTime);
        }
      }
    );
  }

  /**
   * 检查是否允许请求
   *
   * @description 根据熔断器状态检查是否允许请求通过
   */
  public allowRequest(): boolean {
    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        return true;

      case CircuitBreakerState.OPEN:
        return false;

      case CircuitBreakerState.HALF_OPEN:
        if (this.halfOpenRequests < (this.config.halfOpenMaxRequests || 1)) {
          this.halfOpenRequests++;
          return true;
        }
        return false;

      default:
        return true;
    }
  }

  /**
   * 记录请求结果
   *
   * @description 记录请求的成功或失败结果
   */
  public recordRequest(success: boolean, responseTime: number): void {
    this.stats.totalRequests++;
    this.stats.averageResponseTime =
      this.calculateAverageResponseTime(responseTime);

    if (success) {
      this.stats.successfulRequests++;
      this.stats.consecutiveFailures = 0;

      if (this.state === CircuitBreakerState.HALF_OPEN) {
        this.transitionToState(CircuitBreakerState.CLOSED);
      }
    } else {
      this.stats.failedRequests++;
      this.stats.consecutiveFailures++;
      this.lastFailureTime = Date.now();

      if (this.state === CircuitBreakerState.HALF_OPEN) {
        this.transitionToState(CircuitBreakerState.OPEN);
      }
    }

    this.stats.failureRate = this.calculateFailureRate();
    this.checkStateTransition();
  }

  /**
   * 检查状态转换
   *
   * @description 检查是否需要转换熔断器状态
   */
  private checkStateTransition(): void {
    if (this.state === CircuitBreakerState.CLOSED) {
      if (this.shouldOpen()) {
        this.transitionToState(CircuitBreakerState.OPEN);
      }
    } else if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldHalfOpen()) {
        this.transitionToState(CircuitBreakerState.HALF_OPEN);
      }
    }
  }

  /**
   * 判断是否应该打开熔断器
   *
   * @description 根据失败率和连续失败次数判断是否应该打开熔断器
   */
  private shouldOpen(): boolean {
    // 检查连续失败次数
    if (this.stats.consecutiveFailures >= this.config.failureThreshold) {
      return true;
    }

    // 检查失败率
    if (this.stats.totalRequests >= (this.config.volumeThreshold || 10)) {
      const failureRate = this.stats.failureRate;
      const threshold = this.config.failureRateThreshold || 0.5;
      return failureRate >= threshold;
    }

    return false;
  }

  /**
   * 判断是否应该进入半开状态
   *
   * @description 根据熔断时间判断是否应该进入半开状态
   */
  private shouldHalfOpen(): boolean {
    const timeSinceLastFailure = Date.now() - this.lastFailureTime;
    return timeSinceLastFailure >= this.config.resetTimeout;
  }

  /**
   * 转换状态
   *
   * @description 转换熔断器状态并触发回调
   */
  private transitionToState(newState: CircuitBreakerState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.stats.state = newState;
      this.stats.lastStateChange = Date.now();
      this.halfOpenRequests = 0;

      // 触发状态变更回调
      if (this.config.onStateChange) {
        this.config.onStateChange(newState, { ...this.stats });
      }

      console.log(
        `Circuit breaker ${this.config.name} state changed: ${oldState} → ${newState}`
      );
    }
  }

  /**
   * 计算失败率
   *
   * @description 计算当前失败率
   */
  private calculateFailureRate(): number {
    if (this.stats.totalRequests === 0) {
      return 0;
    }
    return this.stats.failedRequests / this.stats.totalRequests;
  }

  /**
   * 计算平均响应时间
   *
   * @description 计算平均响应时间
   */
  private calculateAverageResponseTime(responseTime: number): number {
    if (this.stats.totalRequests === 1) {
      return responseTime;
    }
    return (
      (this.stats.averageResponseTime * (this.stats.totalRequests - 1) +
        responseTime) /
      this.stats.totalRequests
    );
  }

  /**
   * 发送熔断器响应
   *
   * @description 发送熔断器拒绝响应
   */
  public sendCircuitBreakerResponse(reply: FastifyReply): void {
    const config = this.config.responseConfig;
    if (!config) {
      throw new Error('Response config is not defined');
    }

    reply.status(config.statusCode || 503);

    // 设置响应头
    if (config.headers) {
      Object.entries(config.headers).forEach(([key, value]) => {
        reply.header(key, value);
      });
    }

    // 设置熔断器状态头
    reply.header('X-Circuit-Breaker-State', this.state);
    reply.header(
      'X-Circuit-Breaker-Failure-Rate',
      this.stats.failureRate.toString()
    );

    reply.send({
      error: 'Circuit Breaker Open',
      message: config.message || 'Service temporarily unavailable',
      circuitBreakerState: this.state,
      failureRate: this.stats.failureRate,
    });
  }

  /**
   * 开始监控
   *
   * @description 开始监控熔断器状态
   */
  private startMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }

    this.monitoringTimer = setInterval(() => {
      this.checkStateTransition();
    }, this.config.monitoringPeriod);
  }

  /**
   * 停止监控
   *
   * @description 停止监控熔断器状态
   */
  stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }
  }

  /**
   * 获取熔断器状态
   *
   * @description 获取当前熔断器状态和统计信息
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * 获取统计信息
   *
   * @description 获取熔断器统计信息
   */
  getStats(): ICircuitBreakerStats {
    return { ...this.stats };
  }

  /**
   * 重置熔断器
   *
   * @description 重置熔断器状态和统计信息
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      failureRate: 0,
      averageResponseTime: 0,
      state: this.state,
      lastStateChange: Date.now(),
      consecutiveFailures: 0,
    };
    this.halfOpenRequests = 0;
    this.lastFailureTime = 0;
  }

  /**
   * 手动打开熔断器
   *
   * @description 手动打开熔断器
   */
  open(): void {
    this.transitionToState(CircuitBreakerState.OPEN);
  }

  /**
   * 手动关闭熔断器
   *
   * @description 手动关闭熔断器
   */
  close(): void {
    this.transitionToState(CircuitBreakerState.CLOSED);
  }

  /**
   * 销毁熔断器
   *
   * @description 销毁熔断器并清理资源
   */
  destroy(): void {
    this.stopMonitoring();
  }
}

/**
 * 创建熔断器中间件
 *
 * @description 创建熔断器中间件的便捷函数
 */
export function createCircuitBreakerMiddleware(
  config: ICircuitBreakerConfig
): CircuitBreakerMiddleware {
  return new CircuitBreakerMiddleware(config);
}

/**
 * 熔断器装饰器
 *
 * @description 用于装饰器模式的熔断器中间件
 */
export function CircuitBreaker(config: ICircuitBreakerConfig) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const circuitBreaker = new CircuitBreakerMiddleware(config);

    descriptor.value = async function (
      request: FastifyRequest,
      reply: FastifyReply
    ) {
      if (!circuitBreaker.allowRequest()) {
        circuitBreaker.sendCircuitBreakerResponse(reply);
        return;
      }

      const startTime = Date.now();
      try {
        const result = await originalMethod.call(this, request, reply);
        circuitBreaker.recordRequest(true, Date.now() - startTime);
        return result;
      } catch (error) {
        circuitBreaker.recordRequest(false, Date.now() - startTime);
        throw error;
      }
    };
  };
}
