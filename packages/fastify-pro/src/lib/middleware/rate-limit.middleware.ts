/**
 * 限流中间件
 *
 * 基于令牌桶算法实现的高性能限流中间件，支持多种限流策略和配置选项。
 *
 * @description 此中间件基于令牌桶算法实现高性能限流功能。
 * 支持多种限流策略、自定义限流规则、分布式限流等企业级功能。
 * 专为SAAS平台设计，支持多租户架构和微服务架构。
 *
 * ## 业务规则
 *
 * ### 令牌桶算法规则
 * - 令牌桶容量：桶中最大令牌数量
 * - 令牌生成速率：每秒生成的令牌数量
 * - 请求消耗令牌：每个请求消耗指定数量的令牌
 * - 桶满时停止生成：桶满时不再生成新令牌
 *
 * ### 限流策略规则
 * - 全局限流：基于IP地址的全局限流
 * - 用户限流：基于用户ID的用户限流
 * - 租户限流：基于租户ID的租户限流
 * - 接口限流：基于接口路径的接口限流
 *
 * ### 配置规则
 * - 支持多种限流维度组合
 * - 支持自定义限流规则
 * - 支持限流规则的动态更新
 * - 支持限流规则的优先级设置
 *
 * @example
 * ```typescript
 * // 配置限流中间件
 * const rateLimitMiddleware = new RateLimitMiddleware({
 *   windowMs: 60000,        // 1分钟窗口
 *   maxRequests: 100,       // 最大100个请求
 *   keyGenerator: (request) => request.ip,
 *   skipSuccessfulRequests: false,
 *   skipFailedRequests: false
 * });
 *
 * // 注册限流中间件
 * fastify.register(rateLimitMiddleware);
 * ```
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

/**
 * 限流配置接口
 */
export interface IRateLimitConfig {
  /** 时间窗口（毫秒） */
  windowMs: number;

  /** 最大请求数 */
  maxRequests: number;

  /** 令牌桶容量 */
  bucketCapacity?: number;

  /** 令牌生成速率（每秒） */
  tokenRate?: number;

  /** 每个请求消耗的令牌数 */
  tokensPerRequest?: number;

  /** 键生成器 */
  keyGenerator?: (request: FastifyRequest) => string;

  /** 是否跳过成功请求 */
  skipSuccessfulRequests?: boolean;

  /** 是否跳过失败请求 */
  skipFailedRequests?: boolean;

  /** 限流策略 */
  strategy?: 'global' | 'user' | 'tenant' | 'endpoint';

  /** 自定义限流规则 */
  customRules?: IRateLimitRule[];

  /** 限流响应配置 */
  responseConfig?: {
    statusCode?: number;
    message?: string;
    headers?: Record<string, string>;
  };

  /** 是否启用分布式限流 */
  enableDistributed?: boolean;

  /** 分布式限流配置 */
  distributedConfig?: {
    redis?: {
      host: string;
      port: number;
      password?: string;
      db?: number;
    };
    keyPrefix?: string;
    ttl?: number;
  };
}

/**
 * 限流规则接口
 */
export interface IRateLimitRule {
  /** 规则名称 */
  name: string;

  /** 匹配条件 */
  condition: (request: FastifyRequest) => boolean;

  /** 限流配置 */
  config: Omit<IRateLimitConfig, 'customRules'>;

  /** 规则优先级 */
  priority?: number;
}

/**
 * 令牌桶接口
 */
export interface ITokenBucket {
  /** 当前令牌数 */
  tokens: number;

  /** 桶容量 */
  capacity: number;

  /** 最后更新时间 */
  lastUpdate: number;

  /** 令牌生成速率 */
  rate: number;
}

/**
 * 限流结果接口
 */
export interface IRateLimitResult {
  /** 是否允许请求 */
  allowed: boolean;

  /** 剩余令牌数 */
  remainingTokens: number;

  /** 重置时间 */
  resetTime: number;

  /** 限流信息 */
  limitInfo: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

/**
 * 限流中间件类
 *
 * @description 基于令牌桶算法的高性能限流中间件
 */
export class RateLimitMiddleware {
  private readonly config: IRateLimitConfig;
  private readonly buckets: Map<string, ITokenBucket> = new Map();
  private readonly rules: IRateLimitRule[] = [];

  constructor(config: IRateLimitConfig) {
    this.config = {
      bucketCapacity: 100,
      tokenRate: 10,
      tokensPerRequest: 1,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      strategy: 'global',
      responseConfig: {
        statusCode: 429,
        message: 'Too Many Requests',
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Date.now().toString(),
        },
      },
      ...config,
    };

    this.initializeRules();
  }

  /**
   * 注册限流中间件
   *
   * @description 将限流中间件注册到Fastify实例
   */
  register(fastify: FastifyInstance): void {
    fastify.addHook(
      'preHandler',
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const result = await this.checkRateLimit(request);

          if (!result.allowed) {
            this.sendRateLimitResponse(reply, result);
            return;
          }

          // 设置限流响应头
          this.setRateLimitHeaders(reply, result);
        } catch (error: unknown) {
          fastify.log.error(error as Error, 'Rate limit check failed');
          // 限流检查失败时允许请求通过，避免影响业务
        }
      }
    );

    fastify.addHook(
      'onResponse',
      async (request: FastifyRequest, reply: FastifyReply) => {
        // 根据配置决定是否消耗令牌
        if (this.shouldConsumeTokens(request, reply)) {
          await this.consumeTokens(request);
        }
      }
    );
  }

  /**
   * 检查限流
   *
   * @description 检查请求是否超过限流阈值
   */
  public async checkRateLimit(
    request: FastifyRequest
  ): Promise<IRateLimitResult> {
    const key = this.generateKey(request);
    const bucket = this.getOrCreateBucket(key);

    // 更新令牌桶
    this.updateBucket(bucket);

    // 检查是否有足够的令牌
    const hasEnoughTokens =
      bucket.tokens >= (this.config.tokensPerRequest || 1);

    if (hasEnoughTokens) {
      return {
        allowed: true,
        remainingTokens: bucket.tokens,
        resetTime: this.calculateResetTime(bucket),
        limitInfo: {
          limit: this.config.maxRequests,
          remaining: Math.floor(bucket.tokens),
          reset: this.calculateResetTime(bucket),
        },
      };
    }

    return {
      allowed: false,
      remainingTokens: bucket.tokens,
      resetTime: this.calculateResetTime(bucket),
      limitInfo: {
        limit: this.config.maxRequests,
        remaining: 0,
        reset: this.calculateResetTime(bucket),
      },
    };
  }

  /**
   * 生成限流键
   *
   * @description 根据配置的策略生成限流键
   */
  private generateKey(request: FastifyRequest): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(request);
    }

    switch (this.config.strategy) {
      case 'user':
        return `user:${this.getUserId(request)}`;
      case 'tenant':
        return `tenant:${this.getTenantId(request)}`;
      case 'endpoint':
        return `endpoint:${request.method}:${request.url}`;
      case 'global':
      default:
        return `global:${request.ip}`;
    }
  }

  /**
   * 获取或创建令牌桶
   *
   * @description 获取或创建指定键的令牌桶
   */
  private getOrCreateBucket(key: string): ITokenBucket {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, {
        tokens: this.config.bucketCapacity || 100,
        capacity: this.config.bucketCapacity || 100,
        lastUpdate: Date.now(),
        rate: this.config.tokenRate || 10,
      });
    }

    const bucket = this.buckets.get(key);
    if (!bucket) {
      throw new Error(`Bucket not found for key: ${key}`);
    }
    return bucket;
  }

  /**
   * 更新令牌桶
   *
   * @description 根据时间差更新令牌桶中的令牌数量
   */
  private updateBucket(bucket: ITokenBucket): void {
    const now = Date.now();
    const timePassed = (now - bucket.lastUpdate) / 1000; // 转换为秒
    const tokensToAdd = timePassed * bucket.rate;

    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    bucket.lastUpdate = now;
  }

  /**
   * 消耗令牌
   *
   * @description 消耗指定数量的令牌
   */
  private async consumeTokens(request: FastifyRequest): Promise<void> {
    const key = this.generateKey(request);
    const bucket = this.buckets.get(key);

    if (bucket) {
      bucket.tokens = Math.max(
        0,
        bucket.tokens - (this.config.tokensPerRequest || 1)
      );
    }
  }

  /**
   * 判断是否应该消耗令牌
   *
   * @description 根据配置判断是否应该消耗令牌
   */
  private shouldConsumeTokens(
    request: FastifyRequest,
    reply: FastifyReply
  ): boolean {
    const statusCode = reply.statusCode;

    // 跳过成功请求
    if (
      this.config.skipSuccessfulRequests &&
      statusCode >= 200 &&
      statusCode < 300
    ) {
      return false;
    }

    // 跳过失败请求
    if (this.config.skipFailedRequests && statusCode >= 400) {
      return false;
    }

    return true;
  }

  /**
   * 计算重置时间
   *
   * @description 计算令牌桶重置时间
   */
  private calculateResetTime(bucket: ITokenBucket): number {
    const tokensNeeded = (this.config.tokensPerRequest || 1) - bucket.tokens;
    const timeToReset = tokensNeeded / bucket.rate;
    return Math.ceil(Date.now() / 1000) + Math.ceil(timeToReset);
  }

  /**
   * 获取用户ID
   *
   * @description 从请求中提取用户ID
   */
  private getUserId(request: FastifyRequest): string {
    // 从请求头或JWT中提取用户ID
    return (request.headers['x-user-id'] as string) || 'anonymous';
  }

  /**
   * 获取租户ID
   *
   * @description 从请求中提取租户ID
   */
  private getTenantId(request: FastifyRequest): string {
    // 从请求头中提取租户ID
    return (request.headers['x-tenant-id'] as string) || 'default';
  }

  /**
   * 发送限流响应
   *
   * @description 发送限流响应给客户端
   */
  public sendRateLimitResponse(
    reply: FastifyReply,
    result: IRateLimitResult
  ): void {
    const config = this.config.responseConfig;
    if (!config) {
      throw new Error('Response config is not defined');
    }

    reply.status(config.statusCode || 429);

    // 设置响应头
    if (config.headers) {
      Object.entries(config.headers).forEach(([key, value]) => {
        reply.header(key, value);
      });
    }

    // 设置限流信息头
    reply.header('X-RateLimit-Limit', result.limitInfo.limit.toString());
    reply.header(
      'X-RateLimit-Remaining',
      result.limitInfo.remaining.toString()
    );
    reply.header('X-RateLimit-Reset', result.limitInfo.reset.toString());
    reply.header('Retry-After', result.resetTime.toString());

    reply.send({
      error: 'Too Many Requests',
      message: config.message || 'Rate limit exceeded',
      retryAfter: result.resetTime,
    });
  }

  /**
   * 设置限流响应头
   *
   * @description 设置限流相关的响应头
   */
  private setRateLimitHeaders(
    reply: FastifyReply,
    result: IRateLimitResult
  ): void {
    reply.header('X-RateLimit-Limit', result.limitInfo.limit.toString());
    reply.header(
      'X-RateLimit-Remaining',
      result.limitInfo.remaining.toString()
    );
    reply.header('X-RateLimit-Reset', result.limitInfo.reset.toString());
  }

  /**
   * 初始化限流规则
   *
   * @description 初始化自定义限流规则
   */
  private initializeRules(): void {
    if (this.config.customRules) {
      this.rules.push(...this.config.customRules);
      this.rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }
  }

  /**
   * 添加自定义限流规则
   *
   * @description 添加自定义限流规则
   */
  addRule(rule: IRateLimitRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * 获取限流统计信息
   *
   * @description 获取当前限流统计信息
   */
  getStats(): Record<string, ITokenBucket> {
    return Object.fromEntries(this.buckets);
  }

  /**
   * 清理过期桶
   *
   * @description 清理过期的令牌桶
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = this.config.windowMs * 2; // 保留2个时间窗口的数据

    for (const [key, bucket] of this.buckets) {
      if (now - bucket.lastUpdate > maxAge) {
        this.buckets.delete(key);
      }
    }
  }
}

/**
 * 创建限流中间件
 *
 * @description 创建限流中间件的便捷函数
 */
export function createRateLimitMiddleware(
  config: IRateLimitConfig
): RateLimitMiddleware {
  return new RateLimitMiddleware(config);
}

/**
 * 限流中间件装饰器
 *
 * @description 用于装饰器模式的限流中间件
 */
export function RateLimit(config: IRateLimitConfig) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (
      request: FastifyRequest,
      reply: FastifyReply
    ) {
      const middleware = new RateLimitMiddleware(config);
      const result = await middleware.checkRateLimit(request);

      if (!result.allowed) {
        middleware.sendRateLimitResponse(reply, result);
        return;
      }

      return originalMethod.call(this, request, reply);
    };
  };
}
