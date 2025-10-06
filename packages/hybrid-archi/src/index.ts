/**
 * Hybrid Architecture 模块精确导出文件
 *
 * 避免重复导出，使用精确的导出策略
 *
 * @description 为业务模块的开发提供统一的混合架构设计模式，以及提供通用的功能组件
 * @since 1.0.0
 */

// 通用功能层 (包含所有横切关注点)
export * from './common';

// 基础设施层 - 只导出基础设施特有的接口
export {
  // 缓存相关
  CacheAdapter,
  CacheManager,
  CacheFactory,
  // 数据库相关
  DatabaseAdapter,
  DatabaseFactory,
  // 消息队列相关
  MessageQueueAdapter,
  // 端口适配器
  PortAdaptersFactory,
  // 基础设施管理器
  InfrastructureManager,
  // 基础设施常量
  INFRASTRUCTURE_CONSTANTS,
} from './infrastructure';

// 通用基础设施组件导出
export * from './infrastructure/adapters/common';
export * from './infrastructure/event-sourcing/common';
export * from './infrastructure/event-driven/common';

// 应用层 - 只导出应用层特有的接口
export {
  // CQRS 相关
  CoreCommandBus,
  CoreQueryBus,
  CoreEventBus,
  // 用例接口
  IUseCase,
  ICommand,
  IQuery,
} from './application';

// 通用应用层组件导出
export * from './application/exceptions/common';
export * from './application/interfaces/common';
export * from './application/services/common';

// 领域层 - 只导出领域层特有的接口
export {
  // 基础实体
  BaseEntity,
  BaseAggregateRoot,
  BaseValueObject,
  // 领域事件
  BaseDomainEvent,
  DomainEvent,
  // 领域服务
  IDomainService,
} from './domain';

// 仓储接口导出
export {
  // 基础仓储接口
  IRepository,
  IRepositoryQueryOptions,
  IPaginatedResult,
  BaseRepositoryError,
  ConcurrencyError,
  EntityNotFoundError,
  ValidationError,
  // 聚合根仓储接口
  IAggregateRepository,
  IAggregateSnapshot,
  IEventStoreRepository,
  IReadModelRepository,
} from './domain/repositories';

// 通用值对象导出
export * from './domain/value-objects/identities';
export * from './domain/value-objects/statuses';
export * from './domain/value-objects/types';

// 通用验证器导出
export * from './domain/validators/common';

// 接口层 - 只导出接口层特有的接口
export {
  // REST控制器
  BaseController,
  // 装饰器
  RequirePermissions,
  TenantContext,
  CurrentUser,
  CacheTTL,
  // 守卫
  JwtAuthGuard,
  PermissionGuard,
  TenantIsolationGuard,
  // 管道
  ValidationPipe,
  // GraphQL解析器
  BaseResolver,
  // WebSocket网关
  BaseGateway,
  // CLI命令
  BaseCommand,
  // 中间件
  LoggingMiddleware,
  // 验证器
  DataValidator,
  // 转换器
  DataTransformer,
} from './interface';

// 通用接口层组件导出
export * from './interface/guards/common';
export * from './interface/decorators/common';
export * from './interface/middleware/common';

// 通用枚举导出 - 使用明确重新导出避免冲突
export {
  UserStatus as CommonUserStatus,
  UserStatusUtils as CommonUserStatusUtils,
} from './domain/enums/common';

// 通用类型导出
export * from './domain/types/common';

// 通用接口层基类导出
export * from './interface/base';

// 对外类型导出（为其他模块提供统一的类型接口）
export * from './types';
