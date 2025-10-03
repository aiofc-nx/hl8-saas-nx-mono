/**
 * 事件存储适配器模块
 *
 * 提供事件存储适配器的统一管理。
 * 作为通用功能组件，支持依赖注入和模块化配置。
 *
 * @description 事件存储适配器模块实现事件存储适配器管理
 * @since 1.0.0
 */

import { DynamicModule, Module, Provider } from '@nestjs/common';
import { DatabaseModule } from '@hl8/database';
import { CacheModule } from '@hl8/cache';
import { LoggerModule } from '@hl8/logger';

import { EventStoreAdapter } from './event-store.adapter';
import { EventStoreFactory } from './event-store.factory';
import { EventStoreManager } from './event-store.manager';

/**
 * 事件存储适配器模块选项
 */
export interface EventStoreAdaptersModuleOptions {
  /** 是否启用事件存储适配器 */
  enableEventStore?: boolean;
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 是否启用压缩 */
  enableCompression?: boolean;
  /** 是否启用加密 */
  enableEncryption?: boolean;
  /** 是否启用分片 */
  enableSharding?: boolean;
  /** 是否启用自动清理 */
  enableAutoCleanup?: boolean;
  /** 是否启用健康检查 */
  enableHealthCheck?: boolean;
  /** 是否启用事件清理 */
  enableEventCleanup?: boolean;
}

/**
 * 事件存储适配器模块
 *
 * 提供事件存储适配器的统一管理
 */
@Module({})
export class EventStoreAdaptersModule {
  /**
   * 创建事件存储适配器模块
   *
   * @param options - 模块选项
   * @returns 事件存储适配器模块
   */
  static forRoot(options: EventStoreAdaptersModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [];
    const imports: DynamicModule[] = [];

    // 添加基础模块
    imports.push(
      DatabaseModule.forRoot({
        mikroORM: {} as any,
      }),
      CacheModule.forRoot({
        redis: {} as any,
      }),
      LoggerModule.forRoot({})
    );

    // 添加管理组件
    providers.push(EventStoreFactory);
    providers.push(EventStoreManager);

    // 根据选项动态添加提供者
    if (options.enableEventStore !== false) {
      providers.push({ provide: 'IEventStore', useClass: EventStoreAdapter });
    }

    return {
      module: EventStoreAdaptersModule,
      imports,
      providers,
      exports: providers,
    };
  }

  /**
   * 创建异步事件存储适配器模块
   *
   * @param options - 模块选项
   * @returns 事件存储适配器模块
   */
  static forRootAsync(
    options: EventStoreAdaptersModuleOptions = {}
  ): DynamicModule {
    const providers: Provider[] = [];
    const imports: DynamicModule[] = [];

    // 添加基础模块
    imports.push(
      DatabaseModule.forRoot({
        mikroORM: {} as any,
      }),
      CacheModule.forRoot({
        redis: {} as any,
      }),
      LoggerModule.forRoot({})
    );

    // 添加管理组件
    providers.push(EventStoreFactory);
    providers.push(EventStoreManager);

    // 根据选项动态添加提供者
    if (options.enableEventStore !== false) {
      providers.push({ provide: 'IEventStore', useClass: EventStoreAdapter });
    }

    return {
      module: EventStoreAdaptersModule,
      imports,
      providers,
      exports: providers,
    };
  }
}
