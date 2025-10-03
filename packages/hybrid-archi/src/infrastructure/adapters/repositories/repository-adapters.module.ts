/**
 * 仓储适配器模块
 *
 * 提供领域层仓储适配器的统一管理。
 * 作为通用功能组件，支持依赖注入和模块化配置。
 *
 * @description 仓储适配器模块实现领域层仓储适配器管理
 * @since 1.0.0
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '@hl8/database';
import { CacheModule } from '@hl8/cache';
import { LoggerModule } from '@hl8/logger';
import { MessagingModule } from '@hl8/messaging';

import { BaseRepositoryAdapter } from './base-repository.adapter';
import { BaseAggregateRepositoryAdapter } from './base-aggregate-repository.adapter';
// import { DomainServiceAdapter } from './domain-service.adapter';

/**
 * 仓储适配器模块
 *
 * 提供领域层仓储适配器的统一管理
 */
@Module({
  imports: [DatabaseModule, CacheModule, LoggerModule, MessagingModule],
  providers: [
    // 仓储适配器
    BaseRepositoryAdapter,
    BaseAggregateRepositoryAdapter,
    // DomainServiceAdapter,
  ],
  exports: [
    // 仓储适配器
    BaseRepositoryAdapter,
    BaseAggregateRepositoryAdapter,
    // DomainServiceAdapter,
  ],
})
export class RepositoryAdaptersModule {
  /**
   * 创建仓储适配器模块
   *
   * @param options - 模块选项
   * @returns 仓储适配器模块
   */
  static forRoot(options?: {
    enableRepository?: boolean;
    enableAggregateRepository?: boolean;
    enableDomainService?: boolean;
    enableCache?: boolean;
    enableEventStore?: boolean;
    enableSnapshot?: boolean;
  }): typeof RepositoryAdaptersModule {
    return RepositoryAdaptersModule;
  }

  /**
   * 创建异步仓储适配器模块
   *
   * @param options - 模块选项
   * @returns 仓储适配器模块
   */
  static forRootAsync(options?: {
    enableRepository?: boolean;
    enableAggregateRepository?: boolean;
    enableDomainService?: boolean;
    enableCache?: boolean;
    enableEventStore?: boolean;
    enableSnapshot?: boolean;
  }): typeof RepositoryAdaptersModule {
    return RepositoryAdaptersModule;
  }
}
