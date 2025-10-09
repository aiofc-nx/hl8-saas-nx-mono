/**
 * SAAS Core 主模块
 *
 * @description SAAS Core 核心业务模块的主入口
 *
 * ## 模块职责
 *
 * ### 核心功能
 * - 租户管理（Tenant Management）
 * - 用户管理（User Management）
 * - 组织管理（Organization Management）
 * - 部门管理（Department Management）
 * - 角色管理（Role Management）
 * - 权限管理（Permission Management）
 *
 * ### 依赖模块
 * - @hl8/hybrid-archi: 架构基础
 * - @hl8/multi-tenancy: 多租户支持
 * - @hl8/common: 通用工具
 * - @mikro-orm/nestjs: ORM集成
 *
 * ### 提供服务
 * - CQRS总线（CommandBus, QueryBus, EventBus）
 * - 事件存储（EventStore, SnapshotStore）
 * - 租户过滤器（TenantFilter）
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     SaasCoreModule.forRoot({
 *       isGlobal: true,
 *       mikroOrm: { ... },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @module SaasCoreModule
 * @since 1.0.0
 */

import { Module, DynamicModule, Global } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CacheModule } from '@hl8/cache';
import { TypedConfigModule, dotenvLoader } from '@hl8/config';
import { CommandBus, QueryBus, EventBus } from '@hl8/hybrid-archi';
import { SaasCoreConfig } from './config/saas-core.config';
import { mikroOrmConfig } from './infrastructure/persistence/mikro-orm.config';
import { EventStoreAdapter } from './infrastructure/event-sourcing/event-store.adapter';
import { SnapshotStoreAdapter } from './infrastructure/event-sourcing/snapshot-store.adapter';

/**
 * SAAS Core 模块配置选项
 *
 * @interface ISaasCoreModuleOptions
 */
export interface ISaasCoreModuleOptions {
  /**
   * 是否全局模块
   * @default false
   */
  isGlobal?: boolean;

  /**
   * MikroORM 配置（可选，覆盖默认配置）
   */
  mikroOrm?: any;

  /**
   * 快照配置（可选）
   */
  snapshot?: {
    snapshotInterval?: number;
    retainCount?: number;
    enableCompression?: boolean;
    enableCache?: boolean;
  };
}

/**
 * SAAS Core 主模块
 *
 * @class SaasCoreModule
 * @description 核心业务模块，提供多租户SAAS平台的基础能力
 */
@Module({})
export class SaasCoreModule {
  /**
   * 配置根模块
   *
   * @description 使用自定义配置创建 SAAS Core 模块
   *
   * @static
   * @param {ISaasCoreModuleOptions} options - 模块配置选项
   * @returns {DynamicModule} 动态模块
   *
   * @example
   * ```typescript
   * SaasCoreModule.forRoot({
   *   isGlobal: true,
   *   mikroOrm: customConfig,
   *   snapshot: {
   *     snapshotInterval: 50,
   *     retainCount: 5,
   *   },
   * })
   * ```
   */
  static forRoot(options: ISaasCoreModuleOptions = {}): DynamicModule {
    const { isGlobal = false, mikroOrm, snapshot } = options;

    return {
      module: SaasCoreModule,
      global: isGlobal,
      imports: [
        // 类型安全配置模块（使用 @hl8/config）
        TypedConfigModule.forRoot({
          schema: SaasCoreConfig,
          load: [
            dotenvLoader({
              separator: '__',
            }),
          ],
          isGlobal: true,
        }),

        // MikroORM 模块
        MikroOrmModule.forRoot(mikroOrm || mikroOrmConfig),

        // 缓存模块（使用 @hl8/cache）
        CacheModule.forRootAsync({
          inject: [SaasCoreConfig],
          useFactory: (config: SaasCoreConfig) => ({
            redis: {
              host: config.redis.host,
              port: config.redis.port,
              password: config.redis.password,
              db: config.redis.db || 0,
            },
            defaultTTL: config.cache?.defaultTTL || 3600,
            keyPrefix: config.cache?.keyPrefix || 'hl8:saas-core:',
            cls: {
              global: true,
              middleware: { mount: true, generateId: true },
            },
          }),
        }),

        // 注意：实体注册将在各个子模块中完成
        // 例如：TenantModule, UserModule, OrganizationModule 等
      ],
      providers: [
        // CQRS 总线
        CommandBus,
        QueryBus,
        EventBus,

        // 事件存储
        EventStoreAdapter,

        // 快照存储
        {
          provide: SnapshotStoreAdapter,
          useFactory: (em: any) => {
            return new SnapshotStoreAdapter(em, snapshot);
          },
          inject: ['EntityManager'],
        },

        // 注意：具体的服务、仓储、用例将在各个子模块中提供
        // 这里只提供核心基础设施
      ],
      exports: [
        // 导出 CQRS 总线
        CommandBus,
        QueryBus,
        EventBus,

        // 导出 MikroORM
        MikroOrmModule,

        // 导出事件存储
        EventStoreAdapter,
        SnapshotStoreAdapter,
      ],
    };
  }

  /**
   * 配置特性模块
   *
   * @description 用于在其他模块中导入 SAAS Core 功能
   *
   * @static
   * @returns {DynamicModule} 动态模块
   *
   * @example
   * ```typescript
   * @Module({
   *   imports: [SaasCoreModule.forFeature()],
   * })
   * export class HrModule {}
   * ```
   */
  static forFeature(): DynamicModule {
    return {
      module: SaasCoreModule,
      providers: [CommandBus, QueryBus, EventBus],
      exports: [CommandBus, QueryBus, EventBus],
    };
  }
}

