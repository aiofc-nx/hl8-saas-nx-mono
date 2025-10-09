/**
 * 缓存适配器模块
 *
 * 提供缓存适配器的统一管理。
 * 作为通用功能组件，支持依赖注入和模块化配置。
 *
 * @description 缓存适配器模块实现缓存适配器管理
 * @since 1.0.0
 */

import { DynamicModule, Module, Provider } from '@nestjs/common';
import { CacheModule, CacheService } from '@hl8/cache';
import { LoggerModule, PinoLogger } from '@hl8/logger';

import { CacheAdapter } from './cache.adapter';
import { CacheFactory } from './cache.factory';
import { CacheManager } from './cache.manager';

/**
 * 缓存适配器模块选项
 */
export interface CacheAdaptersModuleOptions {
  /** 是否启用缓存适配器 */
  enableCache?: boolean;
  /** 是否启用内存缓存 */
  enableMemoryCache?: boolean;
  /** 是否启用Redis缓存 */
  enableRedisCache?: boolean;
  /** 是否启用分布式缓存 */
  enableDistributedCache?: boolean;
  /** 是否启用缓存压缩 */
  enableCompression?: boolean;
  /** 是否启用缓存加密 */
  enableEncryption?: boolean;
  /** 是否启用缓存统计 */
  enableStatistics?: boolean;
  /** 是否启用缓存预热 */
  enableWarmup?: boolean;
  /** 是否启用自动清理 */
  enableAutoCleanup?: boolean;
  /** 是否启用健康检查 */
  enableHealthCheck?: boolean;
}

/**
 * 缓存适配器模块
 *
 * 提供缓存适配器的统一管理
 */
@Module({})
export class CacheAdaptersModule {
  /**
   * 创建缓存适配器模块
   *
   * @param options - 模块选项
   * @returns 缓存适配器模块
   */
  static forRoot(options: CacheAdaptersModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [];

    // 添加管理组件
    providers.push(CacheFactory);
    providers.push({
      provide: CacheManager,
      useFactory: (cacheService, logger, cacheFactory) => {
        return new CacheManager(cacheService, logger, cacheFactory, {
          enableAutoCleanup: options.enableAutoCleanup,
          enableHealthCheck: options.enableHealthCheck,
          enableStatistics: options.enableStatistics,
        });
      },
      inject: [CacheService, PinoLogger, CacheFactory],
    });

    // 根据选项动态添加提供者
    if (options.enableCache !== false) {
      providers.push({ provide: 'ICache', useClass: CacheAdapter });
    }

    return {
      module: CacheAdaptersModule,
      imports: [
        CacheModule.forRoot({ redis: {} as any }),
        LoggerModule.forRoot({})
      ],
      providers,
      exports: providers,
    };
  }

  /**
   * 创建异步缓存适配器模块
   *
   * @param options - 模块选项
   * @returns 缓存适配器模块
   */
  static forRootAsync(options: CacheAdaptersModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [];

    // 添加管理组件
    providers.push(CacheFactory);
    providers.push({
      provide: CacheManager,
      useFactory: (cacheService, logger, cacheFactory) => {
        return new CacheManager(cacheService, logger, cacheFactory, {
          enableAutoCleanup: options.enableAutoCleanup,
          enableHealthCheck: options.enableHealthCheck,
          enableStatistics: options.enableStatistics,
        });
      },
      inject: [CacheService, PinoLogger, CacheFactory],
    });

    // 根据选项动态添加提供者
    if (options.enableCache !== false) {
      providers.push({ provide: 'ICache', useClass: CacheAdapter });
    }

    return {
      module: CacheAdaptersModule,
      imports: [
        CacheModule.forRoot({ redis: {} as any }),
        LoggerModule.forRoot({})
      ],
      providers,
      exports: providers,
    };
  }
}
