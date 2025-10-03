/**
 * 领域服务适配器
 *
 * 实现领域层服务接口，提供统一的领域服务能力。
 * 作为通用功能组件，支持领域服务的依赖注入和生命周期管理。
 *
 * @description 领域服务适配器实现领域层服务需求
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { CacheService } from '@hl8/cache';
import { IDomainService } from '../../../domain/services/base/domain-service.interface';

/**
 * 领域服务配置接口
 */
export interface IDomainServiceConfig {
  /** 是否启用缓存 */
  enableCache: boolean;
  /** 缓存TTL（秒） */
  cacheTtl: number;
  /** 是否启用日志 */
  enableLogging: boolean;
  /** 是否启用性能监控 */
  enablePerformanceMonitoring: boolean;
  /** 是否启用事务 */
  enableTransaction: boolean;
  /** 最大重试次数 */
  maxRetries: number;
  /** 重试延迟（毫秒） */
  retryDelay: number;
}

/**
 * 领域服务适配器
 *
 * 实现领域层服务接口
 */
@Injectable()
export class DomainServiceAdapter implements IDomainService {
  private readonly config: IDomainServiceConfig;

  constructor(
    private readonly logger: PinoLogger,
    private readonly cacheService: CacheService,
    private readonly serviceName: string,
    config: Partial<IDomainServiceConfig> = {}
  ) {
    this.config = {
      enableCache: config.enableCache ?? true,
      cacheTtl: config.cacheTtl ?? 300,
      enableLogging: config.enableLogging ?? true,
      enablePerformanceMonitoring: config.enablePerformanceMonitoring ?? true,
      enableTransaction: config.enableTransaction ?? true,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
    };
  }

  /**
   * 获取服务名称
   *
   * @returns 服务名称
   */
  getServiceName(): string {
    return this.serviceName;
  }

  /**
   * 执行领域服务操作
   *
   * @param operation - 操作名称
   * @param parameters - 操作参数
   * @returns 操作结果
   */
  async execute<T = unknown>(
    operation: string,
    parameters: Record<string, unknown> = {}
  ): Promise<T> {
    const startTime = this.config.enablePerformanceMonitoring ? Date.now() : 0;

    try {
      // 记录操作开始
      if (this.config.enableLogging) {
        this.logger.debug(`开始执行领域服务操作: ${this.serviceName}`, {
          operation,
          parameters,
        });
      }

      // 检查缓存
      if (this.config.enableCache) {
        const cacheKey = this.getCacheKey(operation, parameters);
        const cached = await this.cacheService.get<T>(cacheKey);
        if (cached) {
          this.logger.debug(`从缓存获取领域服务结果: ${this.serviceName}`, {
            operation,
            cacheKey,
          });
          return cached;
        }
      }

      // 执行具体操作
      const result = await this.executeOperation<T>(operation, parameters);

      // 缓存结果
      if (this.config.enableCache && result) {
        const cacheKey = this.getCacheKey(operation, parameters);
        await this.cacheService.set(cacheKey, result, this.config.cacheTtl);
      }

      // 记录操作完成
      if (this.config.enableLogging) {
        const duration = this.config.enablePerformanceMonitoring
          ? Date.now() - startTime
          : 0;

        this.logger.debug(`领域服务操作完成: ${this.serviceName}`, {
          operation,
          duration,
          success: true,
        });
      }

      return result;
    } catch (error) {
      // 记录操作失败
      if (this.config.enableLogging) {
        const duration = this.config.enablePerformanceMonitoring
          ? Date.now() - startTime
          : 0;

        this.logger.error(`领域服务操作失败: ${this.serviceName}`, error, {
          operation,
          duration,
          success: false,
        });
      }

      throw error;
    }
  }

  /**
   * 执行事务操作
   *
   * @param operation - 操作名称
   * @param parameters - 操作参数
   * @returns 操作结果
   */
  async executeTransaction<T = unknown>(
    operation: string,
    parameters: Record<string, unknown> = {}
  ): Promise<T> {
    if (!this.config.enableTransaction) {
      return this.execute<T>(operation, parameters);
    }

    const startTime = this.config.enablePerformanceMonitoring ? Date.now() : 0;

    try {
      // 记录事务开始
      if (this.config.enableLogging) {
        this.logger.debug(`开始执行领域服务事务: ${this.serviceName}`, {
          operation,
          parameters,
        });
      }

      // 执行事务操作
      const result = await this.executeTransactionOperation<T>(
        operation,
        parameters
      );

      // 记录事务完成
      if (this.config.enableLogging) {
        const duration = this.config.enablePerformanceMonitoring
          ? Date.now() - startTime
          : 0;

        this.logger.debug(`领域服务事务完成: ${this.serviceName}`, {
          operation,
          duration,
          success: true,
        });
      }

      return result;
    } catch (error) {
      // 记录事务失败
      if (this.config.enableLogging) {
        const duration = this.config.enablePerformanceMonitoring
          ? Date.now() - startTime
          : 0;

        this.logger.error(`领域服务事务失败: ${this.serviceName}`, error, {
          operation,
          duration,
          success: false,
        });
      }

      throw error;
    }
  }

  /**
   * 执行重试操作
   *
   * @param operation - 操作名称
   * @param parameters - 操作参数
   * @returns 操作结果
   */
  async executeWithRetry<T = unknown>(
    operation: string,
    parameters: Record<string, unknown> = {}
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await this.execute<T>(operation, parameters);
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.config.maxRetries) {
          this.logger.warn(
            `领域服务操作失败，重试中 (${attempt}/${this.config.maxRetries})`,
            {
              serviceName: this.serviceName,
              operation,
              error: lastError.message,
            }
          );
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }

    throw lastError || new Error('领域服务操作失败');
  }

  /**
   * 获取服务状态
   *
   * @returns 服务状态
   */
  getStatus(): {
    serviceName: string;
    config: IDomainServiceConfig;
    healthy: boolean;
    timestamp: Date;
  } {
    return {
      serviceName: this.serviceName,
      config: { ...this.config },
      healthy: true,
      timestamp: new Date(),
    };
  }

  /**
   * 健康检查
   *
   * @returns 健康状态
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    status: string;
    details: Record<string, unknown>;
  }> {
    try {
      // 检查缓存服务
      const cacheHealthy = this.config.enableCache
        ? await this.checkCacheHealth()
        : true;

      // 检查日志服务
      const logHealthy = this.config.enableLogging
        ? await this.checkLogHealth()
        : true;

      const healthy = cacheHealthy && logHealthy;

      return {
        healthy,
        status: healthy ? 'healthy' : 'unhealthy',
        details: {
          serviceName: this.serviceName,
          cacheHealthy,
          logHealthy,
          config: this.config,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        healthy: false,
        status: 'error',
        details: {
          serviceName: this.serviceName,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * 清理缓存
   *
   * @param pattern - 缓存键模式
   * @returns 清理的缓存数量
   */
  async clearCache(pattern?: string): Promise<number> {
    if (!this.config.enableCache) {
      return 0;
    }

    try {
      const cachePattern = pattern || `${this.serviceName}:*`;
      // 使用兼容性检查调用 deletePattern 方法
      if (typeof (this.cacheService as any).deletePattern === 'function') {
        return await (this.cacheService as any).deletePattern(cachePattern);
      } else {
        console.warn('CacheService不支持deletePattern方法');
        return 0;
      }
    } catch (error) {
      this.logger.error(`清理领域服务缓存失败: ${this.serviceName}`, error);
      throw error;
    }
  }

  /**
   * 获取服务指标
   *
   * @returns 服务指标
   */
  async getMetrics(): Promise<{
    serviceName: string;
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageExecutionTime: number;
    cacheHitRate: number;
  }> {
    // 实现具体的指标收集逻辑
    // 这里需要根据具体的监控服务来实现
    return {
      serviceName: this.serviceName,
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageExecutionTime: 0,
      cacheHitRate: 0,
    };
  }

  /**
   * 获取服务配置
   *
   * @returns 服务配置
   */
  getConfiguration(): IDomainServiceConfig {
    return { ...this.config };
  }

  /**
   * 更新服务配置
   *
   * @param config - 新配置
   */
  updateConfiguration(config: Partial<IDomainServiceConfig>): void {
    Object.assign(this.config, config);
  }

  // ==================== 私有方法 ====================

  /**
   * 执行具体操作
   */
  private async executeOperation<T>(
    operation: string,
    parameters: Record<string, unknown>
  ): Promise<T> {
    // 实现具体的领域服务操作逻辑
    // 这里需要根据具体的领域服务类型来实现
    throw new Error(`需要实现具体的领域服务操作: ${operation}`);
  }

  /**
   * 执行事务操作
   */
  private async executeTransactionOperation<T>(
    operation: string,
    parameters: Record<string, unknown>
  ): Promise<T> {
    // 实现具体的事务操作逻辑
    // 这里需要根据具体的领域服务类型来实现
    throw new Error(`需要实现具体的事务操作: ${operation}`);
  }

  /**
   * 获取缓存键
   */
  private getCacheKey(
    operation: string,
    parameters: Record<string, unknown>
  ): string {
    const paramsHash = this.hashParameters(parameters);
    return `${this.serviceName}:${operation}:${paramsHash}`;
  }

  /**
   * 哈希参数
   */
  private hashParameters(parameters: Record<string, unknown>): string {
    const sortedParams = Object.keys(parameters)
      .sort()
      .map((key) => `${key}=${JSON.stringify(parameters[key])}`)
      .join('&');

    return Buffer.from(sortedParams).toString('base64');
  }

  /**
   * 延迟执行
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 检查缓存健康状态
   */
  private async checkCacheHealth(): Promise<boolean> {
    try {
      const testKey = `${this.serviceName}:health:${Date.now()}`;
      await this.cacheService.set(testKey, 'test', 1);
      const result = await this.cacheService.get(testKey);
      await this.cacheService.delete(testKey);
      return result === 'test';
    } catch {
      return false;
    }
  }

  /**
   * 检查日志健康状态
   */
  private async checkLogHealth(): Promise<boolean> {
    try {
      this.logger.debug(`健康检查: ${this.serviceName}`);
      return true;
    } catch {
      return false;
    }
  }
}
