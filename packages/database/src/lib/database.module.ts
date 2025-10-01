/**
 * 数据库管理模块
 *
 * @description HL8 SAAS平台数据库管理核心模块
 * 提供MikroORM集成、多租户支持、连接管理、事务管理等功能
 *
 * @fileoverview 数据库模块实现文件
 * @since 1.0.0
 */

import { Module, DynamicModule, Global, Provider } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DI_TOKENS } from './constants';
import { ConnectionManager } from './connection.manager';
import { DatabaseService } from './database.service';
import { TenantDatabaseService } from './tenant-database.service';
import { MigrationService } from './migration.service';
import { DatabaseMonitorService } from './monitoring/database-monitor.service';
import type { DatabaseModuleOptions } from './types';

/**
 * 数据库管理模块
 *
 * @description HL8 SAAS平台的数据库管理核心模块
 * 集成 MikroORM、nestjs-cls，提供多租户数据库管理功能
 *
 * ## 业务规则
 *
 * ### 模块化设计规则
 * - 支持同步和异步配置方式
 * - 支持全局模块和局部模块
 * - 支持多数据库实例
 * - 支持动态模块配置
 *
 * ### 依赖注入规则
 * - 使用常量令牌进行依赖注入
 * - 避免循环依赖问题
 * - 支持自定义提供者
 * - 支持工厂模式配置
 *
 * ### 生命周期规则
 * - 模块初始化时建立数据库连接
 * - 模块销毁时清理所有连接
 * - 支持优雅关闭
 * - 支持热重载
 *
 * @example
 * ```typescript
 * // 同步配置
 * @Module({
 *   imports: [
 *     DatabaseModule.forRoot({
 *       mikroORM: {
 *         entities: [User, Tenant],
 *         dbName: 'hl8_saas',
 *         type: 'postgresql',
 *         host: 'localhost',
 *         port: 5432,
 *       },
 *       tenant: {
 *         enableIsolation: true,
 *         isolationStrategy: 'database',
 *       },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // 异步配置
 * @Module({
 *   imports: [
 *     DatabaseModule.forRootAsync({
 *       useFactory: (configService: ConfigService) => ({
 *         mikroORM: {
 *           entities: [User, Tenant],
 *           dbName: configService.get('DB_NAME'),
 *           type: 'postgresql',
 *           host: configService.get('DB_HOST'),
 *           port: configService.get('DB_PORT'),
 *         },
 *       }),
 *       inject: [ConfigService],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @since 1.0.0
 */
@Global()
@Module({})
export class DatabaseModule {
  /**
   * 配置数据库模块（同步方式）
   *
   * @description 使用同步配置方式初始化数据库模块
   * 适用于配置项在编译时已知的场景
   *
   * @param options - 数据库模块配置选项
   * @returns 动态模块配置
   *
   * @example
   * ```typescript
   * DatabaseModule.forRoot({
   *   mikroORM: {
   *     entities: [User],
   *     dbName: 'hl8_saas',
   *     type: 'postgresql',
   *   },
   * })
   * ```
   */
  static forRoot(options: DatabaseModuleOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: DI_TOKENS.MODULE_OPTIONS,
        useValue: options,
      },
      ConnectionManager,
      DatabaseService,
      TenantDatabaseService,
      MigrationService,
      DatabaseMonitorService,
    ];

    return {
      module: DatabaseModule,
      imports: [
        // 集成 nestjs-cls 用于上下文管理
        ClsModule.forRoot({
          middleware: { mount: true },
          global: true,
        }),
        // 集成 MikroORM
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        MikroOrmModule.forRoot(options.mikroORM as any),
      ],
      providers,
      exports: [
        DI_TOKENS.MODULE_OPTIONS,
        ConnectionManager,
        DatabaseService,
        TenantDatabaseService,
        MigrationService,
        DatabaseMonitorService,
      ],
    };
  }

  /**
   * 配置数据库模块（异步方式）
   *
   * @description 使用异步配置方式初始化数据库模块
   * 适用于需要从配置服务或其他异步源获取配置的场景
   *
   * @param options - 异步配置选项
   * @returns 动态模块配置
   *
   * @example
   * ```typescript
   * DatabaseModule.forRootAsync({
   *   useFactory: async (configService: ConfigService) => ({
   *     mikroORM: {
   *       entities: [User],
   *       dbName: configService.get('DB_NAME'),
   *       type: 'postgresql',
   *     },
   *   }),
   *   inject: [ConfigService],
   * })
   * ```
   */
  static forRootAsync(options: {
    useFactory: (
      ...args: unknown[]
    ) => Promise<DatabaseModuleOptions> | DatabaseModuleOptions;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inject?: any[];
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: DI_TOKENS.MODULE_OPTIONS,
        useFactory: options.useFactory,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        inject: (options.inject as any[]) || [],
      },
      ConnectionManager,
      DatabaseService,
      TenantDatabaseService,
      MigrationService,
      DatabaseMonitorService,
    ];

    return {
      module: DatabaseModule,
      imports: [
        // 集成 nestjs-cls 用于上下文管理
        ClsModule.forRoot({
          middleware: { mount: true },
          global: true,
        }),
        // MikroORM 异步配置
         
        MikroOrmModule.forRootAsync({
          useFactory: async (...args: unknown[]) => {
            const config = await options.useFactory(...args);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return config.mikroORM as any;
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          inject: options.inject as any[],
        } as any),
      ],
      providers,
      exports: [
        DI_TOKENS.MODULE_OPTIONS,
        ConnectionManager,
        DatabaseService,
        TenantDatabaseService,
        MigrationService,
        DatabaseMonitorService,
      ],
    };
  }
}
