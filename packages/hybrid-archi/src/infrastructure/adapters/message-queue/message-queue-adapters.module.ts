/**
 * 消息队列适配器模块
 *
 * 提供消息队列适配器的统一管理。
 * 作为通用功能组件，支持依赖注入和模块化配置。
 *
 * @description 消息队列适配器模块实现消息队列适配器管理
 * @since 1.0.0
 */

import { DynamicModule, Module, Provider } from '@nestjs/common';
import { MessagingModule } from '@hl8/messaging';
import { CacheModule } from '@hl8/cache';
import { LoggerModule } from '@hl8/logger';

import { MessageQueueAdapter } from './message-queue.adapter';
import { MessageQueueFactory } from './message-queue.factory';
import { MessageQueueManager } from './message-queue.manager';

/**
 * 消息队列适配器模块选项
 */
export interface MessageQueueAdaptersModuleOptions {
  /** 是否启用消息队列适配器 */
  enableMessageQueue?: boolean;
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 是否启用重试 */
  enableRetry?: boolean;
  /** 是否启用死信队列 */
  enableDeadLetterQueue?: boolean;
  /** 是否启用消息持久化 */
  enablePersistence?: boolean;
  /** 是否启用消息压缩 */
  enableCompression?: boolean;
  /** 是否启用消息加密 */
  enableEncryption?: boolean;
  /** 是否启用自动清理 */
  enableAutoCleanup?: boolean;
  /** 是否启用健康检查 */
  enableHealthCheck?: boolean;
  /** 是否启用消息清理 */
  enableMessageCleanup?: boolean;
}

/**
 * 消息队列适配器模块
 *
 * 提供消息队列适配器的统一管理
 */
@Module({})
export class MessageQueueAdaptersModule {
  /**
   * 创建消息队列适配器模块
   *
   * @param options - 模块选项
   * @returns 消息队列适配器模块
   */
  static forRoot(
    options: MessageQueueAdaptersModuleOptions = {}
  ): DynamicModule {
    const providers: Provider[] = [];
    const imports: DynamicModule[] = [];

    // 添加基础模块
    imports.push(
      MessagingModule.forRoot({ adapter: 'memory' as any }),
      CacheModule.forRoot({
        redis: {} as any,
      }),
      LoggerModule.forRoot({})
    );

    // 添加管理组件
    providers.push(MessageQueueFactory);
    providers.push(MessageQueueManager);

    // 根据选项动态添加提供者
    if (options.enableMessageQueue !== false) {
      providers.push({
        provide: 'IMessageQueue',
        useClass: MessageQueueAdapter,
      });
    }

    return {
      module: MessageQueueAdaptersModule,
      imports,
      providers,
      exports: providers,
    };
  }

  /**
   * 创建异步消息队列适配器模块
   *
   * @param options - 模块选项
   * @returns 消息队列适配器模块
   */
  static forRootAsync(
    options: MessageQueueAdaptersModuleOptions = {}
  ): DynamicModule {
    const providers: Provider[] = [];
    const imports: DynamicModule[] = [];

    // 添加基础模块
    imports.push(
      MessagingModule.forRoot({ adapter: 'memory' as any }),
      CacheModule.forRoot({
        redis: {} as any,
      }),
      LoggerModule.forRoot({})
    );

    // 添加管理组件
    providers.push(MessageQueueFactory);
    providers.push(MessageQueueManager);

    // 根据选项动态添加提供者
    if (options.enableMessageQueue !== false) {
      providers.push({
        provide: 'IMessageQueue',
        useClass: MessageQueueAdapter,
      });
    }

    return {
      module: MessageQueueAdaptersModule,
      imports,
      providers,
      exports: providers,
    };
  }
}
