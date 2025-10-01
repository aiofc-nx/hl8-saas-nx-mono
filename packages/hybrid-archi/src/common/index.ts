/**
 * 通用功能层导出
 *
 * @description 导出所有层都会使用的通用功能
 * 包括上下文管理、错误处理、装饰器系统、测试工具等横切关注点
 * 集成重构后的基础设施模块
 * @since 1.0.0
 */

// 重构后的基础设施模块集成
export { Logger, LoggerModule } from '@hl8/logger';
export { ConfigService, ConfigModule } from '@hl8/config';
export { CacheService, CacheModule } from '@hl8/cache';
export {
  TenantContextService,
  TenantIsolationService,
  MultiTenancyModule,
} from '@hl8/multi-tenancy';

// 上下文管理系统
export * from './context';

// 错误处理机制 - 使用 @hl8/common/exceptions 模块
export {
  GeneralBadRequestException,
  GeneralNotFoundException,
  GeneralInternalServerException,
  AnyExceptionFilter,
  ExceptionModule,
} from '@hl8/common/exceptions';

// 错误处理机制
export { ErrorType, CoreErrorBus, CoreExceptionFilter } from './error-handling';

export type {
  IErrorClassifier,
  IErrorHandler,
  IErrorNotifier,
  IErrorRecovery,
  IErrorBus,
  IExceptionFilter,
} from './error-handling';

// 装饰器系统 - 已从shared层合并到此处
export * from './decorators';

// 测试工具 - 已从shared层合并到此处
export * from './testing';

// 通用工具函数 - 已从shared层合并到此处
export * from './utils';

// 多租户技术基础设施 - 已迁移到 @hl8/multi-tenancy
// export * from './multi-tenant';

// 接口已迁移到相应的模块中
// 性能监控已移动到infrastructure层
// export * from './monitoring';
// 测试工具已移动到shared层
// export * from './testing';
// 实体系统已移动到domain层
// export * from './entities';
// CQRS系统已移动到application层
// export * from './cqrs';
// 消息队列已移动到infrastructure层
// export * from './message-queue';
