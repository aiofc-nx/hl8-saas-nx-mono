/**
 * 领域事件模块导出
 *
 * @description 导出领域事件相关的所有公共API
 * @since 1.0.0
 */

// 基础设施 - 明确导出以避免命名冲突
export {
  BaseDomainEvent,
  IDomainEvent,
  IDomainEventHandler,
  IDomainEventBus,
  IDomainEventStore,
  EventMetadata,
  DomainEvent,
} from './base';

// 装饰器 - 明确导出以避免命名冲突
export {
  DomainEvent as DomainEventDecorator,
  EventHandler,
  getDomainEventMetadata,
  isDomainEvent,
  getEventHandlers,
  DomainEventRegistry,
  DOMAIN_EVENT_METADATA_KEY,
  DomainEventOptions,
} from './decorators';
