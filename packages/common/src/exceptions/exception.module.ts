import { Module, DynamicModule, Provider } from '@nestjs/common';
import { APP_FILTER, HttpAdapterHost } from '@nestjs/core';
import {
  ExceptionConfig,
  DEFAULT_EXCEPTION_CONFIG,
} from './config/exception.config';
import {
  ExceptionMessageProvider,
  DefaultExceptionMessageProvider,
} from './config/exception-message.provider';
import { AnyExceptionFilter } from './filters/any-exception.filter';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { DI_TOKENS } from '../constants';

/**
 * 异常处理模块
 *
 * @description 提供统一的异常处理机制，支持标准化错误响应、消息提供者、自定义日志等功能
 * 遵循RFC7807标准，集成自定义logger，支持多租户架构
 */
@Module({})
export class ExceptionModule {
  /**
   * 同步配置异常模块
   *
   * @param config 异常配置选项
   * @returns 动态模块配置
   */
  static forRoot(config?: ExceptionConfig): DynamicModule {
    const mergedConfig = { ...DEFAULT_EXCEPTION_CONFIG, ...config };

    const messageProvider: Provider = {
      provide: DI_TOKENS.EXCEPTION_MESSAGE_PROVIDER,
      useValue:
        mergedConfig.messageProvider || new DefaultExceptionMessageProvider(),
    };

    return {
      module: ExceptionModule,
      providers: [
        messageProvider,
        {
          provide: APP_FILTER,
          useFactory: (
            httpAdapterHost: HttpAdapterHost,
            msgProvider: ExceptionMessageProvider,
            logger: unknown
          ) =>
            new AnyExceptionFilter(
              httpAdapterHost,
              msgProvider,
              mergedConfig.documentationUrl,
              logger as any
            ),
          inject: [
            HttpAdapterHost,
            DI_TOKENS.EXCEPTION_MESSAGE_PROVIDER,
            DI_TOKENS.LOGGER_PROVIDER,
          ],
        },
        {
          provide: APP_FILTER,
          useFactory: (
            httpAdapterHost: HttpAdapterHost,
            msgProvider: ExceptionMessageProvider,
            logger: unknown
          ) =>
            new HttpExceptionFilter(
              httpAdapterHost,
              msgProvider,
              mergedConfig.documentationUrl,
              logger as any
            ),
          inject: [
            HttpAdapterHost,
            DI_TOKENS.EXCEPTION_MESSAGE_PROVIDER,
            DI_TOKENS.LOGGER_PROVIDER,
          ],
        },
      ],
      exports: [DI_TOKENS.EXCEPTION_MESSAGE_PROVIDER],
    };
  }

  /**
   * 异步配置异常模块
   *
   * @param options 异步配置选项
   * @returns 动态模块配置
   */
  static forRootAsync(options: {
    useFactory: (
      ...args: unknown[]
    ) => Promise<ExceptionConfig> | ExceptionConfig;
    inject?: unknown[];
  }): DynamicModule {
    const messageProvider: Provider = {
      provide: DI_TOKENS.EXCEPTION_MESSAGE_PROVIDER,
      useFactory: async (...args: unknown[]) => {
        const config = await options.useFactory(...args);
        return config.messageProvider || new DefaultExceptionMessageProvider();
      },
      inject: options.inject as any[],
    };

    const exceptionConfigProvider: Provider = {
      provide: DI_TOKENS.EXCEPTION_CONFIG,
      useFactory: options.useFactory,
      inject: options.inject as any[],
    };

    return {
      module: ExceptionModule,
      providers: [
        exceptionConfigProvider,
        messageProvider,
        {
          provide: APP_FILTER,
          useFactory: (
            httpAdapterHost: HttpAdapterHost,
            msgProvider: ExceptionMessageProvider,
            config: ExceptionConfig
          ) =>
            new AnyExceptionFilter(
              httpAdapterHost,
              msgProvider,
              config.documentationUrl
            ),
          inject: [
            HttpAdapterHost,
            DI_TOKENS.EXCEPTION_MESSAGE_PROVIDER,
            DI_TOKENS.EXCEPTION_CONFIG,
          ],
        },
        {
          provide: APP_FILTER,
          useFactory: (
            httpAdapterHost: HttpAdapterHost,
            msgProvider: ExceptionMessageProvider,
            config: ExceptionConfig
          ) =>
            new HttpExceptionFilter(
              httpAdapterHost,
              msgProvider,
              config.documentationUrl
            ),
          inject: [
            HttpAdapterHost,
            DI_TOKENS.EXCEPTION_MESSAGE_PROVIDER,
            DI_TOKENS.EXCEPTION_CONFIG,
          ],
        },
      ],
      exports: [DI_TOKENS.EXCEPTION_MESSAGE_PROVIDER],
    };
  }
}
