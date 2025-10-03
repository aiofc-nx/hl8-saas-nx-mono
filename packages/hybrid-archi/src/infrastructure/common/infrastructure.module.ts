/**
 * 基础设施模块
 *
 * 提供业务模块所需的通用基础设施功能模块。
 * 集成重构后的基础设施模块，提供统一的基础设施服务。
 *
 * @description 通用基础设施功能组件模块
 * @since 1.0.0
 */

import { Module } from '@nestjs/common';
import { CacheModule } from '@hl8/cache';
import { LoggerModule } from '@hl8/logger';
import { TypedConfigModule } from '@hl8/config';
import { MessagingModule } from '@hl8/messaging';
import { MultiTenancyModule } from '@hl8/multi-tenancy';
import { DatabaseModule } from '@hl8/database';
import { FastifyProModule } from '@hl8/fastify-pro';

import { InfrastructureServiceManager } from './base-infrastructure.adapter';

/**
 * 基础设施模块
 *
 * 提供业务模块所需的通用基础设施功能
 */
@Module({
  imports: [
    // 重构后的基础设施模块
    CacheModule,
    LoggerModule,
    TypedConfigModule,
    MessagingModule,
    MultiTenancyModule,
    DatabaseModule,
    FastifyProModule,
  ],
  providers: [InfrastructureServiceManager],
  exports: [
    // 重构后的基础设施模块
    CacheModule,
    LoggerModule,
    TypedConfigModule,
    MessagingModule,
    MultiTenancyModule,
    DatabaseModule,
    FastifyProModule,
    // 基础设施服务管理器
    InfrastructureServiceManager,
  ],
})
export class InfrastructureModule {
  /**
   * 创建基础设施模块
   *
   * @param options - 模块选项
   * @returns 基础设施模块
   */
  static forRoot(options?: {
    enableCache?: boolean;
    enableLogging?: boolean;
    enableConfig?: boolean;
    enableMessaging?: boolean;
    enableMultiTenancy?: boolean;
    enableDatabase?: boolean;
    enableWeb?: boolean;
  }): typeof InfrastructureModule {
    return InfrastructureModule;
  }

  /**
   * 创建异步基础设施模块
   *
   * @param options - 模块选项
   * @returns 基础设施模块
   */
  static forRootAsync(options?: {
    enableCache?: boolean;
    enableLogging?: boolean;
    enableConfig?: boolean;
    enableMessaging?: boolean;
    enableMultiTenancy?: boolean;
    enableDatabase?: boolean;
    enableWeb?: boolean;
  }): typeof InfrastructureModule {
    return InfrastructureModule;
  }
}
