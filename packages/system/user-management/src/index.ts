/**
 * 用户管理模块导出文件
 *
 * 基于Hybrid Architecture的用户管理模块，提供完整的用户生命周期管理功能。
 *
 * @description 用户管理模块是SAAS平台的核心基础模块，基于Hybrid Architecture设计。
 * 提供用户注册、认证、授权、个人信息管理等完整功能。
 * 支持多租户架构和事件驱动架构。
 *
 * @since 1.0.0
 */

// 领域层导出
export * from './domain/value-objects/user-id.vo';
// Email, Username, Password 值对象现在直接从 @hl8/hybrid-archi 导入
export * from './domain/value-objects/user-profile.vo';
export * from './domain/value-objects/user-preferences.vo';
// UserStatus 枚举现在直接从 @hl8/hybrid-archi 导入
export * from './domain/entities/user.entity';
export * from './domain/aggregates/user.aggregate';
export * from './domain/events/user-registered.event';
export * from './domain/events/user-authenticated.event';
export * from './domain/events/user-profile-updated.event';
export * from './domain/events/user-assigned-to-tenant.event';
export * from './domain/events/user-password-updated.event';
export * from './domain/events/user-disabled.event';
export * from './domain/events/user-enabled.event';
export * from './domain/events/user-deleted.event';

// 应用层导出
export * from './application/commands/create-user.command';
export * from './application/commands/update-user-profile.command';
export * from './application/commands/authenticate-user.command';
export * from './application/queries/get-user.query';
export * from './application/queries/list-users.query';
export * from './application/services/user-application.service';
export * from './application/commands/handlers/create-user.handler';
export * from './application/commands/handlers/update-user-profile.handler';
export * from './application/commands/handlers/authenticate-user.handler';
export * from './application/commands/handlers/user-registered.handler';
export * from './application/commands/handlers/user-profile-updated.handler';
export * from './application/queries/handlers/get-user.handler';
export * from './application/queries/handlers/list-users.handler';
export * from './application/use-cases/register-user.use-case';
export * from './application/use-cases/update-user-profile.use-case';
export * from './application/use-cases/authenticate-user.use-case';
// 命令总线和查询总线现在直接从 @hl8/hybrid-archi 导入
// export * from './application/bus/command-bus'; // 已删除，使用 hybrid-archi 中的 CoreCommandBus
// export * from './application/bus/query-bus'; // 已删除，使用 hybrid-archi 中的 CoreQueryBus
export * from './application/dtos/create-user.dto';
export * from './application/dtos/update-user-profile.dto';
export * from './application/dtos/user-response.dto';
// 应用层异常现在直接从 @hl8/hybrid-archi 导入
export * from './application/exceptions/user.exception';
// 缓存服务和处理器接口现在直接从 @hl8/hybrid-archi 导入

// 基础设施层导出
export * from './infrastructure/repositories/user.repository.interface';
export * from './infrastructure/repositories/user.repository';
// 事件存储和快照存储现在直接从 @hl8/hybrid-archi 导入
// 这些通用组件已经在 hybrid-archi 模块中实现
// export * from './infrastructure/repositories/event-store'; // 已删除，使用 hybrid-archi 中的实现
// export * from './infrastructure/repositories/snapshot-store'; // 已删除，使用 hybrid-archi 中的实现

// 事件总线现在直接从 @hl8/hybrid-archi 导入
// export * from './infrastructure/services/event-bus'; // 已删除，使用 hybrid-archi 中的 CoreEventBus
// event-publisher.service 和 database.adapter 现在直接从 @hl8/hybrid-archi 导入
// 缓存适配器、消息队列适配器、邮件服务适配器现在直接从 @hl8/hybrid-archi 导入

// ES事件溯源组件导出
export * from './infrastructure/projections/user-read-model.repository.interface';
export * from './infrastructure/projections/user-projection.handler';
export * from './infrastructure/services/event-replay.service';

// EDA事件驱动架构组件导出
export * from './infrastructure/services/event-orchestration.service';
export * from './infrastructure/services/dead-letter-queue.service';
export * from './infrastructure/services/event-monitoring.service';
export * from './infrastructure/filters/event-filter.interface';
export * from './infrastructure/filters/event-filter';

// 接口层导出
export * from './interfaces';

// 模块导出
export * from './user-management.module';

// 类型导出
export * from './types/user.types';
