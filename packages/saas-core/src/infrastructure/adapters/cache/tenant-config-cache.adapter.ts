/**
 * 租户配置缓存适配器
 *
 * @description 租户配置的缓存管理，基于 @hl8/cache 实现
 *
 * ## 缓存策略
 * - TTL: 1小时
 * - 键格式: tenant:config:{tenantId}
 * - 配置变更时主动失效
 * - 自动租户隔离
 *
 * @class TenantConfigCacheAdapter
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { CacheService, Cacheable, CacheEvict } from '@hl8/cache';
import { TENANT_CACHE_CONFIG } from '../../../constants/tenant.constants';

export interface ITenantConfig {
  maxUsers: number;
  maxStorageMB: number;
  maxOrganizations: number;
  maxDepartmentLevels: number;
  maxApiCallsPerDay: number;
  enabledFeatures: string[];
  customSettings: Record<string, unknown>;
}

@Injectable()
export class TenantConfigCacheAdapter {
  constructor(private readonly cacheService: CacheService) {}

  /**
   * 生成缓存键
   *
   * @param {string} tenantId - 租户ID
   * @returns {string} 缓存键
   */
  private getCacheKey(tenantId: string): string {
    return `${TENANT_CACHE_CONFIG.KEY_PREFIX}:config:${tenantId}`;
  }

  /**
   * 获取租户配置
   *
   * @async
   * @param {string} tenantId - 租户ID
   * @returns {Promise<ITenantConfig | null>} 租户配置
   */
  @Cacheable('tenant:config', TENANT_CACHE_CONFIG.CONFIG_TTL)
  async get(tenantId: string): Promise<ITenantConfig | null> {
    const key = this.getCacheKey(tenantId);
    return await this.cacheService.get<ITenantConfig>(key);
  }

  /**
   * 设置租户配置
   *
   * @async
   * @param {string} tenantId - 租户ID
   * @param {ITenantConfig} config - 租户配置
   * @returns {Promise<void>}
   */
  async set(tenantId: string, config: ITenantConfig): Promise<void> {
    const key = this.getCacheKey(tenantId);
    await this.cacheService.set(key, config, TENANT_CACHE_CONFIG.CONFIG_TTL);
  }

  /**
   * 删除租户配置缓存（失效）
   *
   * @async
   * @param {string} tenantId - 租户ID
   * @returns {Promise<void>}
   */
  @CacheEvict('tenant:config')
  async invalidate(tenantId: string): Promise<void> {
    const key = this.getCacheKey(tenantId);
    await this.cacheService.delete(key);
  }

  /**
   * 批量删除租户配置缓存
   *
   * @async
   * @param {string[]} tenantIds - 租户ID列表
   * @returns {Promise<void>}
   */
  async invalidateMany(tenantIds: string[]): Promise<void> {
    const keys = tenantIds.map(id => this.getCacheKey(id));
    // 逐个删除缓存（CacheService 不提供 deleteMany 方法）
    await Promise.all(keys.map(key => this.cacheService.delete(key)));
  }
}
