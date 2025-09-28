import { Module, DynamicModule, Provider } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ExceptionConfig, DEFAULT_EXCEPTION_CONFIG } from './config/exception.config';
import { ExceptionMessageProvider, DefaultExceptionMessageProvider } from './config/exception-message.provider';
import { AnyExceptionFilter } from './filters/any-exception.filter';
import { HttpExceptionFilter } from './filters/http-exception.filter';

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
      provide: 'EXCEPTION_MESSAGE_PROVIDER',
      useValue: mergedConfig.messageProvider || new DefaultExceptionMessageProvider(),
    };

    return {
      module: ExceptionModule,
      providers: [
        messageProvider,
        {
          provide: APP_FILTER,
          useFactory: (
            httpAdapterHost: any,
            msgProvider: ExceptionMessageProvider,
          ) => new AnyExceptionFilter(httpAdapterHost, msgProvider, mergedConfig.documentationUrl),
          inject: ['HttpAdapterHost', 'EXCEPTION_MESSAGE_PROVIDER'],
        },
        {
          provide: APP_FILTER,
          useFactory: (
            httpAdapterHost: any,
            msgProvider: ExceptionMessageProvider,
          ) => new HttpExceptionFilter(httpAdapterHost, msgProvider, mergedConfig.documentationUrl),
          inject: ['HttpAdapterHost', 'EXCEPTION_MESSAGE_PROVIDER'],
        },
      ],
      exports: ['EXCEPTION_MESSAGE_PROVIDER'],
    };
  }

  /**
   * 异步配置异常模块
   *
   * @param options 异步配置选项
   * @returns 动态模块配置
   */
  static forRootAsync(options: {
    useFactory: (...args: any[]) => Promise<ExceptionConfig> | ExceptionConfig;
    inject?: any[];
  }): DynamicModule {
    const messageProvider: Provider = {
      provide: 'EXCEPTION_MESSAGE_PROVIDER',
      useFactory: async (...args: any[]) => {
        const config = await options.useFactory(...args);
        return config.messageProvider || new DefaultExceptionMessageProvider();
      },
      inject: options.inject,
    };

    const exceptionConfigProvider: Provider = {
      provide: 'EXCEPTION_CONFIG',
      useFactory: options.useFactory,
      inject: options.inject,
    };

    return {
      module: ExceptionModule,
      providers: [
        exceptionConfigProvider,
        messageProvider,
        {
          provide: APP_FILTER,
          useFactory: (
            httpAdapterHost: any,
            msgProvider: ExceptionMessageProvider,
            config: ExceptionConfig,
          ) => new AnyExceptionFilter(httpAdapterHost, msgProvider, config.documentationUrl),
          inject: ['HttpAdapterHost', 'EXCEPTION_MESSAGE_PROVIDER', 'EXCEPTION_CONFIG'],
        },
        {
          provide: APP_FILTER,
          useFactory: (
            httpAdapterHost: any,
            msgProvider: ExceptionMessageProvider,
            config: ExceptionConfig,
          ) => new HttpExceptionFilter(httpAdapterHost, msgProvider, config.documentationUrl),
          inject: ['HttpAdapterHost', 'EXCEPTION_MESSAGE_PROVIDER', 'EXCEPTION_CONFIG'],
        },
      ],
      exports: ['EXCEPTION_MESSAGE_PROVIDER'],
    };
  }
}
