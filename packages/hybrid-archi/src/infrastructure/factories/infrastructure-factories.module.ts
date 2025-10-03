/**
 * 基础设施工厂模块
 *
 * 提供基础设施工厂的统一管理。
 * 作为通用功能组件，支持依赖注入和模块化配置。
 *
 * @description 基础设施工厂模块实现基础设施工厂管理
 * @since 1.0.0
 */

import { DynamicModule, Module, Provider } from '@nestjs/common';
import { LoggerModule } from '@hl8/logger';
import { CacheModule } from '@hl8/cache';
import { DatabaseModule } from '@hl8/database';
import { MessagingModule } from '@hl8/messaging';
import { MultiTenancyModule } from '@hl8/multi-tenancy';

import { InfrastructureFactory } from './infrastructure.factory';
import { InfrastructureManager } from './infrastructure.manager';

/**
 * 基础设施工厂模块选项
 */
export interface InfrastructureFactoriesModuleOptions {
  /** 是否启用基础设施工厂 */
  enableInfrastructureFactory?: boolean;
  /** 是否启用基础设施管理器 */
  enableInfrastructureManager?: boolean;
  /** 是否启用自动启动 */
  enableAutoStart?: boolean;
  /** 是否启用自动停止 */
  enableAutoStop?: boolean;
  /** 是否启用健康检查 */
  enableHealthCheck?: boolean;
  /** 是否启用统计收集 */
  enableStatistics?: boolean;
  /** 是否启用服务依赖检查 */
  enableDependencyCheck?: boolean;
}

/**
 * 基础设施工厂模块
 *
 * 提供基础设施工厂的统一管理
 */
@Module({})
export class InfrastructureFactoriesModule {
  /**
   * 创建基础设施工厂模块
   *
   * @param options - 模块选项
   * @returns 基础设施工厂模块
   */
  static forRoot(
    options: InfrastructureFactoriesModuleOptions = {}
  ): DynamicModule {
    const providers: Provider[] = [];
    const imports: DynamicModule[] = [];

    // 添加基础模块
    imports.push(
      LoggerModule.forRoot({}),
      CacheModule.forRoot({
        redis: {} as any,
      }),
      DatabaseModule.forRoot({ mikroORM: {} as any }),
      MessagingModule.forRoot({ adapter: 'memory' as any }),
      MultiTenancyModule.forRoot({
        context: {} as any,
        isolation: {} as any,
        middleware: {} as any,
        security: {} as any,
      })
    );

    // 添加管理组件
    if (options.enableInfrastructureFactory !== false) {
      providers.push(InfrastructureFactory);
    }

    if (options.enableInfrastructureManager !== false) {
      providers.push(InfrastructureManager);
    }

    return {
      module: InfrastructureFactoriesModule,
      imports,
      providers,
      exports: providers,
    };
  }

  /**
   * 创建异步基础设施工厂模块
   *
   * @param options - 模块选项
   * @returns 基础设施工厂模块
   */
  static forRootAsync(
    options: InfrastructureFactoriesModuleOptions = {}
  ): DynamicModule {
    const providers: Provider[] = [];
    const imports: DynamicModule[] = [];

    // 添加基础模块
    imports.push(
      LoggerModule.forRoot({}),
      CacheModule.forRoot({
        redis: {} as any,
      }),
      DatabaseModule.forRoot({ mikroORM: {} as any }),
      MessagingModule.forRoot({ adapter: 'memory' as any }),
      MultiTenancyModule.forRoot({
        context: {} as any,
        isolation: {} as any,
        middleware: {} as any,
        security: {} as any,
      })
    );

    // 添加管理组件
    if (options.enableInfrastructureFactory !== false) {
      providers.push(InfrastructureFactory);
    }

    if (options.enableInfrastructureManager !== false) {
      providers.push(InfrastructureManager);
    }

    return {
      module: InfrastructureFactoriesModule,
      imports,
      providers,
      exports: providers,
    };
  }
}
