/**
 * Core模块对外类型导出
 *
 * @description 为其他模块提供Core模块的核心类型接口
 * 确保类型的一致性和可用性
 *
 * @since 1.0.0
 */

// ==================== 多租户相关类型 ====================
// 已迁移到 @hl8/multi-tenancy 模块，请使用以下导入：
// import { TenantContextService, ITenantContext, TenantIsolationService } from '@hl8/multi-tenancy';

// 租户上下文类型 - 已迁移
// export type { ITenantContextData as TenantContext } from '../common/multi-tenant/context/tenant-context-manager';

// 租户上下文管理器 - 已迁移
// export { TenantContextManager } from '../common/multi-tenant/context/tenant-context-manager';

// 隔离策略相关类型 - 已迁移
// export {
//   IsolationLevel,
//   DataSensitivity,
//   DataIsolationContext,
// } from '../common/multi-tenant/isolation/isolation-context';

// ==================== 性能监控相关类型 ====================
// 性能监控已迁移到 @hl8/logger 模块，请使用以下导入：
// import { Logger, LoggerModule } from '@hl8/logger';

// ==================== 事件总线相关类型 ====================

// 事件总线
export { CoreEventBus } from '../application/cqrs/bus/core-event-bus';

// CQRS总线
export { CoreCQRSBus } from '../application/cqrs/bus/core-cqrs-bus';

// ==================== 错误处理相关类型 ====================

// 错误总线
export { CoreErrorBus } from '../common/error-handling/core-error-bus';

// 基础错误类型 - 使用 @hl8/common/exceptions 模块
// export { BaseError, BusinessError, SystemError } from '../common/errors'; // 已删除重复代码

// ==================== 实体和值对象类型 ====================

// 基础实体
export { BaseEntity, BaseAggregateRoot } from '../domain/entities/base';

// 实体ID
export { EntityId } from '../domain/value-objects/entity-id';

// ==================== 配置集成类型 ====================
// 配置服务已迁移到 @hl8/config 模块，请使用以下导入：
// import { ConfigService, ConfigModule } from '@hl8/config';
