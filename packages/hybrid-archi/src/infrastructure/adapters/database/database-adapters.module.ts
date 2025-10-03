/**
 * 数据库适配器模块
 *
 * 提供数据库适配器的统一管理。
 * 作为通用功能组件，支持依赖注入和模块化配置。
 *
 * @description 数据库适配器模块实现数据库适配器管理
 * @since 1.0.0
 */

import { DynamicModule, Module, Provider } from '@nestjs/common';
import { DatabaseModule } from '@hl8/database';
import { LoggerModule } from '@hl8/logger';

import { DatabaseAdapter } from './database.adapter';
import { DatabaseFactory } from './database.factory';
import { DatabaseManager } from './database.manager';

/**
 * 数据库适配器模块选项
 */
export interface DatabaseAdaptersModuleOptions {
  /** 是否启用数据库适配器 */
  enableDatabase?: boolean;
  /** 是否启用PostgreSQL */
  enablePostgreSQL?: boolean;
  /** 是否启用MongoDB */
  enableMongoDB?: boolean;
  /** 是否启用事务 */
  enableTransaction?: boolean;
  /** 是否启用连接池 */
  enableConnectionPool?: boolean;
  /** 是否启用查询缓存 */
  enableQueryCache?: boolean;
  /** 是否启用查询日志 */
  enableQueryLogging?: boolean;
  /** 是否启用慢查询监控 */
  enableSlowQueryMonitoring?: boolean;
  /** 是否启用自动清理 */
  enableAutoCleanup?: boolean;
  /** 是否启用健康检查 */
  enableHealthCheck?: boolean;
  /** 是否启用统计收集 */
  enableStatistics?: boolean;
  /** 是否启用自动连接 */
  enableAutoConnect?: boolean;
}

/**
 * 数据库适配器模块
 *
 * 提供数据库适配器的统一管理
 */
@Module({})
export class DatabaseAdaptersModule {
  /**
   * 创建数据库适配器模块
   *
   * @param options - 模块选项
   * @returns 数据库适配器模块
   */
  static forRoot(options: DatabaseAdaptersModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [];
    const imports: DynamicModule[] = [];

    // 添加基础模块
    imports.push(
      DatabaseModule.forRoot({ mikroORM: {} as any }),
      LoggerModule.forRoot({})
    );

    // 添加管理组件
    providers.push(DatabaseFactory);
    providers.push(DatabaseManager);

    // 根据选项动态添加提供者
    if (options.enableDatabase !== false) {
      providers.push({ provide: 'IDatabase', useClass: DatabaseAdapter });
    }

    return {
      module: DatabaseAdaptersModule,
      imports,
      providers,
      exports: providers,
    };
  }

  /**
   * 创建异步数据库适配器模块
   *
   * @param options - 模块选项
   * @returns 数据库适配器模块
   */
  static forRootAsync(
    options: DatabaseAdaptersModuleOptions = {}
  ): DynamicModule {
    const providers: Provider[] = [];
    const imports: DynamicModule[] = [];

    // 添加基础模块
    imports.push(
      DatabaseModule.forRoot({ mikroORM: {} as any }),
      LoggerModule.forRoot({})
    );

    // 添加管理组件
    providers.push(DatabaseFactory);
    providers.push(DatabaseManager);

    // 根据选项动态添加提供者
    if (options.enableDatabase !== false) {
      providers.push({ provide: 'IDatabase', useClass: DatabaseAdapter });
    }

    return {
      module: DatabaseAdaptersModule,
      imports,
      providers,
      exports: providers,
    };
  }
}
