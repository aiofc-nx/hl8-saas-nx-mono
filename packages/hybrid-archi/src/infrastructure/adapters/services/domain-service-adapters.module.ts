/**
 * 领域服务适配器模块
 *
 * 提供领域服务适配器的统一管理。
 * 作为通用功能组件，支持依赖注入和模块化配置。
 *
 * @description 领域服务适配器模块实现领域服务适配器管理
 * @since 1.0.0
 */

import { Module } from '@nestjs/common';
import { CacheModule } from '@hl8/cache';
import { LoggerModule } from '@hl8/logger';

import { DomainServiceAdapter } from './domain-service.adapter';
import { DomainServiceFactory } from './domain-service.factory';
import { DomainServiceManager } from './domain-service.manager';

/**
 * 领域服务适配器模块
 *
 * 提供领域服务适配器的统一管理
 */
@Module({
  imports: [CacheModule, LoggerModule],
  providers: [
    // 领域服务适配器
    DomainServiceAdapter,
    DomainServiceFactory,
    DomainServiceManager,
  ],
  exports: [
    // 领域服务适配器
    DomainServiceAdapter,
    DomainServiceFactory,
    DomainServiceManager,
  ],
})
export class DomainServiceAdaptersModule {
  /**
   * 创建领域服务适配器模块
   *
   * @param options - 模块选项
   * @returns 领域服务适配器模块
   */
  static forRoot(options?: {
    enableAutoCleanup?: boolean;
    cleanupInterval?: number;
    maxServiceAge?: number;
    enableHealthCheck?: boolean;
    healthCheckInterval?: number;
  }): typeof DomainServiceAdaptersModule {
    return DomainServiceAdaptersModule;
  }

  /**
   * 创建异步领域服务适配器模块
   *
   * @param options - 模块选项
   * @returns 领域服务适配器模块
   */
  static forRootAsync(options?: {
    enableAutoCleanup?: boolean;
    cleanupInterval?: number;
    maxServiceAge?: number;
    enableHealthCheck?: boolean;
    healthCheckInterval?: number;
  }): typeof DomainServiceAdaptersModule {
    return DomainServiceAdaptersModule;
  }
}
