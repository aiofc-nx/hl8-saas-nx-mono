/**
 * 事件过滤器接口
 *
 * @description 事件过滤器的接口定义，支持事件过滤和路由
 * @since 1.0.0
 */

import { DomainEvent } from '@hl8/hybrid-archi';

/**
 * 过滤条件接口
 *
 * @description 事件过滤的条件定义
 */
export interface FilterCondition {
  field: string;
  operator:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'greater_than'
    | 'less_than'
    | 'in'
    | 'not_in';
  value: any;
}

/**
 * 事件过滤器接口
 *
 * @description 事件过滤器的接口定义，支持事件过滤和路由
 *
 * ## 过滤功能
 *
 * ### 条件过滤
 * - 支持多种比较操作符
 * - 支持复合条件
 * - 支持动态过滤
 * - 支持租户隔离
 *
 * ### 性能优化
 * - 支持索引优化
 * - 支持缓存策略
 * - 支持批量过滤
 * - 支持异步过滤
 */
export interface IEventFilter {
  /**
   * 检查是否应该处理事件
   *
   * @description 检查事件是否满足过滤条件
   * @param event - 要检查的事件
   * @returns 是否应该处理
   */
  shouldProcess(event: DomainEvent): boolean;

  /**
   * 过滤事件列表
   *
   * @description 从事件列表中过滤出符合条件的事件
   * @param events - 事件列表
   * @returns 过滤后的事件列表
   */
  filterEvents(events: DomainEvent[]): DomainEvent[];

  /**
   * 添加过滤条件
   *
   * @description 添加新的过滤条件
   * @param condition - 过滤条件
   * @returns 添加结果
   */
  addCondition(condition: FilterCondition): void;

  /**
   * 移除过滤条件
   *
   * @description 移除指定的过滤条件
   * @param field - 字段名
   * @returns 移除结果
   */
  removeCondition(field: string): void;

  /**
   * 清空过滤条件
   *
   * @description 清空所有过滤条件
   * @returns 清空结果
   */
  clearConditions(): void;

  /**
   * 获取过滤条件
   *
   * @description 获取当前的过滤条件列表
   * @returns 过滤条件列表
   */
  getConditions(): FilterCondition[];

  /**
   * 设置租户过滤
   *
   * @description 设置租户过滤条件
   * @param tenantId - 租户ID
   * @returns 设置结果
   */
  setTenantFilter(tenantId: string): void;

  /**
   * 清除租户过滤
   *
   * @description 清除租户过滤条件
   * @returns 清除结果
   */
  clearTenantFilter(): void;
}
