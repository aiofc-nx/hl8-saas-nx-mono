/**
 * 缓存模块
 *
 * @description HL8 SAAS平台缓存模块，提供高性能、多租户的缓存解决方案
 * 基于Redis和nestjs-cls，支持租户隔离、上下文管理、监控统计等功能
 *
 * @since 1.0.0
 */

import { DynamicModule, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { CacheModuleOptions, CACHE_MODULE_OPTIONS } from './types/cache.types';
import { CacheService } from './cache.service';
import { RedisService } from './redis.service';
import { ContextService } from './context.service';
import { CacheMonitorService } from './monitoring/cache-monitor.service';
import { CacheStatsService } from './monitoring/cache-stats.service';
import { HealthCheckService } from './monitoring/health-check.service';

/**
 * 缓存模块配置选项
 */
export interface CacheModuleAsyncOptions {
  useFactory?: (
    ...args: any[]
  ) => Promise<CacheModuleOptions> | CacheModuleOptions;
  inject?: any[];
  imports?: any[];
}

/**
 * 缓存模块
 *
 * @description 提供缓存服务的NestJS模块
 */
@Module({})
export class CacheModule {
  /**
   * 同步配置模块
   *
   * @description 使用同步配置初始化缓存模块
   */
  static forRoot(options: CacheModuleOptions): DynamicModule {
    return {
      module: CacheModule,
      imports: [
        ClsModule.forRoot({
          global: true,
          middleware: {
            mount: true,
            generateId: options.cls?.middleware?.generateId ?? true,
          },
          interceptor: {
            mount: options.cls?.interceptor?.mount ?? true,
          },
        }),
      ],
      providers: [
        {
          provide: CACHE_MODULE_OPTIONS,
          useValue: options,
        },
        RedisService,
        ContextService,
        CacheService,
        CacheMonitorService,
        CacheStatsService,
        HealthCheckService,
      ],
      exports: [
        CacheService,
        ContextService,
        CacheMonitorService,
        CacheStatsService,
        HealthCheckService,
      ],
    };
  }

  /**
   * 异步配置模块
   *
   * @description 使用异步配置初始化缓存模块
   */
  static forRootAsync(options: CacheModuleAsyncOptions): DynamicModule {
    return {
      module: CacheModule,
      imports: [
        ClsModule.forRootAsync({
          global: true,
          useFactory: async (...args: any[]) => {
            const cacheOptions = await options.useFactory!(...args);
            return {
              middleware: {
                mount: true,
                generateId: cacheOptions.cls?.middleware?.generateId ?? true,
              },
              interceptor: {
                mount: cacheOptions.cls?.interceptor?.mount ?? true,
              },
            };
          },
          inject: options.inject || [],
          imports: options.imports || [],
        }),
      ],
      providers: [
        {
          provide: CACHE_MODULE_OPTIONS,
          useFactory: options.useFactory!,
          inject: options.inject || [],
        },
        RedisService,
        ContextService,
        CacheService,
        CacheMonitorService,
        CacheStatsService,
        HealthCheckService,
      ],
      exports: [
        CacheService,
        ContextService,
        CacheMonitorService,
        CacheStatsService,
        HealthCheckService,
      ],
    };
  }
}
