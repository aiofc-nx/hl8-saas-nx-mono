/**
 * 端口适配器模块
 *
 * 提供应用层端口适配器的统一管理。
 * 作为通用功能组件，支持依赖注入和模块化配置。
 *
 * @description 端口适配器模块实现应用层端口适配器管理
 * @since 1.0.0
 */

import { DynamicModule, Module, Provider } from '@nestjs/common';
import { LoggerModule } from '@hl8/logger';
import { TypedConfigModule } from '@hl8/config';
import { MessagingModule } from '@hl8/messaging';

import { LoggerPortAdapter } from './logger-port.adapter';
import { IdGeneratorPortAdapter } from './id-generator-port.adapter';
import { TimeProviderPortAdapter } from './time-provider-port.adapter';
import { ValidationPortAdapter } from './validation-port.adapter';
import { ConfigurationPortAdapter } from './configuration-port.adapter';
import { EventBusPortAdapter } from './event-bus-port.adapter';
import { PortAdaptersFactory } from './port-adapters.factory';
import { PortAdaptersManager } from './port-adapters.manager';

/**
 * 端口适配器模块选项
 */
export interface PortAdaptersModuleOptions {
  /** 是否启用日志端口适配器 */
  enableLogger?: boolean;
  /** 是否启用ID生成器端口适配器 */
  enableIdGenerator?: boolean;
  /** 是否启用时间提供者端口适配器 */
  enableTimeProvider?: boolean;
  /** 是否启用验证端口适配器 */
  enableValidation?: boolean;
  /** 是否启用配置端口适配器 */
  enableConfiguration?: boolean;
  /** 是否启用事件总线端口适配器 */
  enableEventBus?: boolean;
}

/**
 * 端口适配器模块
 *
 * 提供应用层端口适配器的统一管理
 */
@Module({})
export class PortAdaptersModule {
  /**
   * 创建端口适配器模块
   *
   * @param options - 模块选项
   * @returns 端口适配器模块
   */
  static forRoot(options: PortAdaptersModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [];
    const imports: any[] = [];

    // 根据选项动态添加提供者
    // 添加管理组件
    providers.push(PortAdaptersFactory);
    providers.push(PortAdaptersManager);

    if (options.enableLogger !== false) {
      imports.push(
        LoggerModule.forRootAsync({
          useFactory: () => ({}),
          inject: [],
        })
      );
      providers.push({ provide: 'ILoggerPort', useClass: LoggerPortAdapter });
    }

    if (options.enableIdGenerator !== false) {
      providers.push({
        provide: 'IIdGeneratorPort',
        useClass: IdGeneratorPortAdapter,
      });
    }

    if (options.enableTimeProvider !== false) {
      providers.push({
        provide: 'ITimeProviderPort',
        useClass: TimeProviderPortAdapter,
      });
    }

    if (options.enableValidation !== false) {
      providers.push({
        provide: 'IValidationPort',
        useClass: ValidationPortAdapter,
      });
    }

    if (options.enableConfiguration !== false) {
      imports.push(
        TypedConfigModule.forRoot({
          schema: class TestConfig {
            appName = 'test-app';
            version = '1.0.0';
            environment = 'test';
          },
          load: () => ({
            appName: 'test-app',
            version: '1.0.0',
            environment: 'test',
          }),
        })
      );
      providers.push({
        provide: 'IConfigurationPort',
        useClass: ConfigurationPortAdapter,
      });
    }

    if (options.enableEventBus !== false) {
      imports.push(
        MessagingModule.forRoot({
          adapter: 'memory' as any,
        })
      );
      providers.push({
        provide: 'IEventBusPort',
        useClass: EventBusPortAdapter,
      });
    }

    return {
      module: PortAdaptersModule,
      imports,
      providers,
      exports: providers,
    };
  }

  /**
   * 创建异步端口适配器模块
   *
   * @param options - 模块选项
   * @returns 端口适配器模块
   */
  static forRootAsync(options: PortAdaptersModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [];
    const imports: DynamicModule[] = [];

    // 根据选项动态添加提供者
    // 添加管理组件
    providers.push(PortAdaptersFactory);
    providers.push(PortAdaptersManager);

    if (options.enableLogger !== false) {
      imports.push(
        LoggerModule.forRootAsync({
          useFactory: () => ({}),
          inject: [],
        })
      );
      providers.push({ provide: 'ILoggerPort', useClass: LoggerPortAdapter });
    }

    if (options.enableIdGenerator !== false) {
      providers.push({
        provide: 'IIdGeneratorPort',
        useClass: IdGeneratorPortAdapter,
      });
    }

    if (options.enableTimeProvider !== false) {
      providers.push({
        provide: 'ITimeProviderPort',
        useClass: TimeProviderPortAdapter,
      });
    }

    if (options.enableValidation !== false) {
      providers.push({
        provide: 'IValidationPort',
        useClass: ValidationPortAdapter,
      });
    }

    if (options.enableConfiguration !== false) {
      imports.push(
        TypedConfigModule.forRoot({
          schema: class TestConfig {
            appName = 'test-app';
            version = '1.0.0';
            environment = 'test';
          },
          load: () => ({
            appName: 'test-app',
            version: '1.0.0',
            environment: 'test',
          }),
        })
      );
      providers.push({
        provide: 'IConfigurationPort',
        useClass: ConfigurationPortAdapter,
      });
    }

    if (options.enableEventBus !== false) {
      imports.push(
        MessagingModule.forRoot({
          adapter: 'memory' as any,
        })
      );
      providers.push({
        provide: 'IEventBusPort',
        useClass: EventBusPortAdapter,
      });
    }

    return {
      module: PortAdaptersModule,
      imports,
      providers,
      exports: providers,
    };
  }
}
