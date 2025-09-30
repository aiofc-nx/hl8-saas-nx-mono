import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { CacheService } from '@hl8/cache';
import {
  TenantContextService,
  TenantIsolationService,
} from '@hl8/multi-tenancy';
import { MessagingCacheConfig } from '../types/messaging.types';

/**
 * 租户配置缓存服务
 *
 * @description 管理租户级别的消息队列配置缓存，支持动态配置更新和配置继承
 * 提供租户特定的队列配置、路由规则、重试策略等个性化配置管理
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class TenantAwareMessagingService {
 *   constructor(
 *     private readonly tenantConfigCache: TenantConfigCacheService
 *   ) {}
 *
 *   async processMessage(message: { id: string; data: unknown }) {
 *     const tenantId = this.getCurrentTenant();
 *     const config = await this.tenantConfigCache.getTenantConfig(tenantId);
 *
 *     // 使用租户特定配置处理消息
 *     await this.processWithTenantConfig(message, config);
 *   }
 * }
 * ```
 */
@Injectable()
export class TenantConfigCacheService {
  private readonly logger = new PinoLogger();
  private readonly cacheTTL: number;
  private readonly keyPrefix: string;

  constructor(
    private readonly cacheService: CacheService,
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService,
    private readonly cacheConfig: MessagingCacheConfig
  ) {
    this.logger.setContext({ requestId: 'tenant-config-cache-service' });
    this.cacheTTL = this.cacheConfig.cacheTTL?.tenantConfig || 3600; // 默认1小时
    this.keyPrefix =
      this.cacheConfig.keyPrefix || 'hl8:messaging:cache:tenant-config:';
  }

  /**
   * 获取租户配置
   *
   * @description 获取指定租户的消息队列配置，支持配置继承和默认值
   *
   * @param tenantId 租户ID
   * @param forceRefresh 是否强制刷新缓存
   * @returns 租户配置
   */
  async getTenantConfig(
    tenantId: string,
    forceRefresh = false
  ): Promise<TenantMessagingConfig> {
    try {
      if (!forceRefresh) {
        const cachedConfig = await this.getCachedTenantConfig(tenantId);
        if (cachedConfig) {
          this.logger.debug('使用缓存的租户配置', {
            tenantId,
            configKeys: Object.keys(cachedConfig),
          });
          return cachedConfig;
        }
      }

      // 从数据源加载配置（这里模拟从数据库或配置服务加载）
      const tenantConfig = await this.loadTenantConfigFromSource(tenantId);

      // 缓存配置
      await this.cacheTenantConfig(tenantId, tenantConfig);

      this.logger.info('租户配置已加载并缓存', {
        tenantId,
        configKeys: Object.keys(tenantConfig),
      });

      return tenantConfig;
    } catch (error) {
      this.logger.error('获取租户配置失败', {
        error: (error as Error).message,
        tenantId,
      });

      // 返回默认配置作为回退
      return this.getDefaultTenantConfig(tenantId);
    }
  }

  /**
   * 更新租户配置
   *
   * @description 更新指定租户的消息队列配置并刷新缓存
   *
   * @param tenantId 租户ID
   * @param config 新的配置
   * @param persist 是否持久化到数据源
   * @returns 更新结果
   */
  async updateTenantConfig(
    tenantId: string,
    config: Partial<TenantMessagingConfig>,
    persist = true
  ): Promise<UpdateResult> {
    try {
      // 获取当前配置
      const currentConfig = await this.getTenantConfig(tenantId);

      // 合并配置
      const updatedConfig = this.mergeConfigs(currentConfig, config);

      // 验证配置
      const validationResult = this.validateTenantConfig(updatedConfig);
      if (!validationResult.valid) {
        return {
          success: false,
          message: '配置验证失败',
          errors: validationResult.errors,
        };
      }

      // 持久化到数据源（如果要求）
      if (persist) {
        await this.persistTenantConfig(tenantId, updatedConfig);
      }

      // 更新缓存
      await this.cacheTenantConfig(tenantId, updatedConfig);

      // 记录配置变更
      await this.logConfigChange(tenantId, currentConfig, updatedConfig);

      this.logger.info('租户配置已更新', {
        tenantId,
        updatedKeys: Object.keys(config),
        persist,
      });

      return {
        success: true,
        message: '配置更新成功',
        config: updatedConfig,
      };
    } catch (error) {
      this.logger.error('更新租户配置失败', {
        error: (error as Error).message,
        tenantId,
        config,
      });

      return {
        success: false,
        message: '配置更新失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * 批量更新租户配置
   *
   * @description 批量更新多个租户的配置
   *
   * @param updates 配置更新列表
   * @param persist 是否持久化到数据源
   * @returns 批量更新结果
   */
  async batchUpdateTenantConfigs(
    updates: TenantConfigUpdate[],
    persist = true
  ): Promise<BatchUpdateResult> {
    try {
      const results: UpdateResult[] = [];
      const promises = updates.map((update) =>
        this.updateTenantConfig(update.tenantId, update.config, persist)
      );

      const updateResults = await Promise.allSettled(promises);

      updateResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            message: '配置更新处理失败',
            error: (result.reason as Error).message,
          });
        }
      });

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      this.logger.info('批量更新租户配置完成', {
        totalCount: updates.length,
        successCount,
        failureCount,
      });

      return {
        totalCount: updates.length,
        successCount,
        failureCount,
        results,
      };
    } catch (error) {
      this.logger.error('批量更新租户配置失败', {
        error: (error as Error).message,
        updates,
      });
      throw error;
    }
  }

  /**
   * 删除租户配置
   *
   * @description 删除指定租户的配置（包括缓存和数据源）
   *
   * @param tenantId 租户ID
   * @param deleteFromSource 是否从数据源删除
   * @returns 删除结果
   */
  async deleteTenantConfig(
    tenantId: string,
    deleteFromSource = true
  ): Promise<DeleteResult> {
    try {
      // 从缓存删除
      await this.removeCachedTenantConfig(tenantId);

      // 从数据源删除（如果要求）
      if (deleteFromSource) {
        await this.deleteTenantConfigFromSource(tenantId);
      }

      this.logger.info('租户配置已删除', {
        tenantId,
        deleteFromSource,
      });

      return {
        success: true,
        message: '配置删除成功',
      };
    } catch (error) {
      this.logger.error('删除租户配置失败', {
        error: (error as Error).message,
        tenantId,
      });

      return {
        success: false,
        message: '配置删除失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * 获取租户配置统计信息
   *
   * @description 获取租户配置的使用统计和缓存统计
   *
   * @param tenantId 租户ID（可选，不提供则获取全局统计）
   * @returns 统计信息
   */
  async getTenantConfigStats(tenantId?: string): Promise<TenantConfigStats> {
    try {
      if (tenantId) {
        return await this.getSingleTenantConfigStats(tenantId);
      } else {
        return await this.getAllTenantConfigStats();
      }
    } catch (error) {
      this.logger.error('获取租户配置统计失败', {
        error: (error as Error).message,
        tenantId,
      });
      throw error;
    }
  }

  /**
   * 刷新租户配置缓存
   *
   * @description 强制刷新指定租户的配置缓存
   *
   * @param tenantId 租户ID（可选，不提供则刷新所有租户）
   * @returns 刷新结果
   */
  async refreshTenantConfigCache(tenantId?: string): Promise<RefreshResult> {
    try {
      if (tenantId) {
        // 刷新单个租户配置
        await this.getTenantConfig(tenantId, true); // forceRefresh = true

        this.logger.info('租户配置缓存已刷新', { tenantId });

        return {
          success: true,
          message: '缓存刷新成功',
          refreshedTenants: [tenantId],
        };
      } else {
        // 刷新所有租户配置
        const pattern = await this.generateCacheKeyPattern();
        const keys = await this.cacheService.keys(pattern);

        const refreshedTenants: string[] = [];
        for (const key of keys) {
          const tenantId = this.extractTenantIdFromKey(key);
          if (tenantId) {
            await this.getTenantConfig(tenantId, true);
            refreshedTenants.push(tenantId);
          }
        }

        this.logger.info('所有租户配置缓存已刷新', {
          refreshedCount: refreshedTenants.length,
        });

        return {
          success: true,
          message: '所有缓存刷新成功',
          refreshedTenants,
        };
      }
    } catch (error) {
      this.logger.error('刷新租户配置缓存失败', {
        error: (error as Error).message,
        tenantId,
      });
      throw error;
    }
  }

  /**
   * 获取缓存的租户配置
   */
  private async getCachedTenantConfig(
    tenantId: string
  ): Promise<TenantMessagingConfig | null> {
    try {
      const cacheKey = await this.generateCacheKey(tenantId);
      return await this.cacheService.get<TenantMessagingConfig>(cacheKey);
    } catch (error) {
      this.logger.warn('获取缓存的租户配置失败', {
        error: (error as Error).message,
        tenantId,
      });
      return null;
    }
  }

  /**
   * 缓存租户配置
   */
  private async cacheTenantConfig(
    tenantId: string,
    config: TenantMessagingConfig
  ): Promise<void> {
    try {
      const cacheKey = await this.generateCacheKey(tenantId);
      await this.cacheService.set(cacheKey, config, this.cacheTTL);
    } catch (error) {
      this.logger.warn('缓存租户配置失败', {
        error: (error as Error).message,
        tenantId,
      });
    }
  }

  /**
   * 移除缓存的租户配置
   */
  private async removeCachedTenantConfig(tenantId: string): Promise<void> {
    try {
      const cacheKey = await this.generateCacheKey(tenantId);
      await this.cacheService.delete(cacheKey);
    } catch (error) {
      this.logger.warn('移除缓存的租户配置失败', {
        error: (error as Error).message,
        tenantId,
      });
    }
  }

  /**
   * 从数据源加载租户配置
   */
  private async loadTenantConfigFromSource(
    tenantId: string
  ): Promise<TenantMessagingConfig> {
    // 模拟从数据库或配置服务加载配置
    // 在实际实现中，这里应该连接到真实的配置存储

    const defaultConfig = this.getDefaultTenantConfig(tenantId);

    // 模拟租户特定配置
    const tenantSpecificConfig: Partial<TenantMessagingConfig> = {
      // 根据租户ID生成特定配置
      queuePrefix: `tenant_${tenantId}_`,
      maxRetries: 3 + (tenantId.length % 3), // 基于租户ID的简单变化
      retryDelay: 1000 * (1 + (tenantId.length % 5)),
    };

    return this.mergeConfigs(defaultConfig, tenantSpecificConfig);
  }

  /**
   * 获取默认租户配置
   */
  private getDefaultTenantConfig(tenantId: string): TenantMessagingConfig {
    return {
      tenantId,
      queuePrefix: 'default_',
      exchangePrefix: 'default_',
      maxRetries: 3,
      retryDelay: 1000,
      retryBackoff: 'exponential',
      enableDeadLetterQueue: true,
      deadLetterTTL: 86400,
      maxMessageSize: 1024 * 1024, // 1MB
      enableMessageCompression: false,
      compressionThreshold: 1024,
      enableMessageEncryption: false,
      routingRules: [],
      rateLimit: {
        enabled: false,
        maxMessagesPerSecond: 100,
        burstSize: 1000,
      },
      monitoring: {
        enableMetrics: true,
        enableTracing: true,
        logLevel: 'info',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 合并配置
   */
  private mergeConfigs(
    base: TenantMessagingConfig,
    override: Partial<TenantMessagingConfig>
  ): TenantMessagingConfig {
    return {
      ...base,
      ...override,
      routingRules: override.routingRules || base.routingRules,
      rateLimit: override.rateLimit
        ? { ...base.rateLimit, ...override.rateLimit }
        : base.rateLimit,
      monitoring: override.monitoring
        ? { ...base.monitoring, ...override.monitoring }
        : base.monitoring,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 验证租户配置
   */
  private validateTenantConfig(
    config: TenantMessagingConfig
  ): ValidationResult {
    const errors: string[] = [];

    if (!config.tenantId) {
      errors.push('租户ID不能为空');
    }

    if (config.maxRetries < 0 || config.maxRetries > 10) {
      errors.push('最大重试次数必须在0-10之间');
    }

    if (config.retryDelay < 100 || config.retryDelay > 300000) {
      errors.push('重试延迟必须在100-300000毫秒之间');
    }

    if (
      config.maxMessageSize < 1024 ||
      config.maxMessageSize > 100 * 1024 * 1024
    ) {
      errors.push('最大消息大小必须在1KB-100MB之间');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 持久化租户配置
   */
  private async persistTenantConfig(
    tenantId: string,
    _config: TenantMessagingConfig
  ): Promise<void> {
    // 模拟持久化到数据库或配置服务
    // 在实际实现中，这里应该连接到真实的存储系统
    this.logger.debug('租户配置已持久化', { tenantId });
  }

  /**
   * 从数据源删除租户配置
   */
  private async deleteTenantConfigFromSource(tenantId: string): Promise<void> {
    // 模拟从数据库或配置服务删除
    this.logger.debug('租户配置已从数据源删除', { tenantId });
  }

  /**
   * 记录配置变更
   */
  private async logConfigChange(
    tenantId: string,
    oldConfig: TenantMessagingConfig,
    newConfig: TenantMessagingConfig
  ): Promise<void> {
    // 记录配置变更日志，用于审计
    this.logger.info('租户配置已变更', {
      tenantId,
      changes: this.detectConfigChanges(oldConfig, newConfig),
    });
  }

  /**
   * 检测配置变更
   */
  private detectConfigChanges(
    oldConfig: TenantMessagingConfig,
    newConfig: TenantMessagingConfig
  ): string[] {
    const changes: string[] = [];

    Object.keys(newConfig).forEach((key) => {
      if (
        key !== 'updatedAt' &&
        (oldConfig as unknown as Record<string, unknown>)[key] !==
          (newConfig as unknown as Record<string, unknown>)[key]
      ) {
        changes.push(key);
      }
    });

    return changes;
  }

  /**
   * 获取单个租户配置统计
   */
  private async getSingleTenantConfigStats(
    tenantId: string
  ): Promise<TenantConfigStats> {
    const cacheKey = await this.generateCacheKey(tenantId);
    const cached = await this.cacheService.exists(cacheKey);

    return {
      tenantId,
      isCached: cached,
      cacheKey,
      lastAccessed: new Date().toISOString(),
    };
  }

  /**
   * 获取所有租户配置统计
   */
  private async getAllTenantConfigStats(): Promise<TenantConfigStats> {
    const pattern = await this.generateCacheKeyPattern();
    const keys = await this.cacheService.keys(pattern);

    return {
      totalTenants: keys.length,
      cachedTenants: keys.length,
      cacheHitRate: 1.0, // 简化计算
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * 生成缓存键
   */
  private async generateCacheKey(tenantId: string): Promise<string> {
    try {
      return await this.tenantIsolationService.getTenantKey(
        `${this.keyPrefix}${tenantId}`,
        tenantId
      );
    } catch (_error) {
      // 回退到简单键前缀
      return `${this.keyPrefix}${tenantId}`;
    }
  }

  /**
   * 生成缓存键模式
   */
  private async generateCacheKeyPattern(): Promise<string> {
    try {
      return `${this.keyPrefix}*`;
    } catch (_error) {
      return `${this.keyPrefix}*`;
    }
  }

  /**
   * 从键中提取租户ID
   */
  private extractTenantIdFromKey(key: string): string | null {
    const match = key.match(new RegExp(`${this.keyPrefix}(.+)`));
    return match ? match[1] : null;
  }
}

// 类型定义
export interface TenantMessagingConfig {
  tenantId: string;
  queuePrefix: string;
  exchangePrefix: string;
  maxRetries: number;
  retryDelay: number;
  retryBackoff: 'linear' | 'exponential' | 'fixed';
  enableDeadLetterQueue: boolean;
  deadLetterTTL: number;
  maxMessageSize: number;
  enableMessageCompression: boolean;
  compressionThreshold: number;
  enableMessageEncryption: boolean;
  routingRules: RoutingRule[];
  rateLimit: RateLimitConfig;
  monitoring: MonitoringConfig;
  createdAt: string;
  updatedAt: string;
}

interface RoutingRule {
  pattern: string;
  targetQueue: string;
  priority: number;
  conditions?: Record<string, unknown>;
}

interface RateLimitConfig {
  enabled: boolean;
  maxMessagesPerSecond: number;
  burstSize: number;
}

interface MonitoringConfig {
  enableMetrics: boolean;
  enableTracing: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

interface UpdateResult {
  success: boolean;
  message: string;
  config?: TenantMessagingConfig;
  errors?: string[];
  error?: string;
}

interface TenantConfigUpdate {
  tenantId: string;
  config: Partial<TenantMessagingConfig>;
}

interface BatchUpdateResult {
  totalCount: number;
  successCount: number;
  failureCount: number;
  results: UpdateResult[];
}

interface DeleteResult {
  success: boolean;
  message: string;
  error?: string;
}

interface TenantConfigStats {
  tenantId?: string;
  totalTenants?: number;
  cachedTenants?: number;
  isCached?: boolean;
  cacheKey?: string;
  cacheHitRate?: number;
  lastAccessed?: string;
  lastUpdated?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface RefreshResult {
  success: boolean;
  message: string;
  refreshedTenants: string[];
}
