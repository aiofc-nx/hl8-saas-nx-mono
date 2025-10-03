/**
 * 事件过滤器实现
 *
 * @description 事件过滤器的具体实现，支持事件过滤和路由
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { DomainEvent } from '@hl8/hybrid-archi';
import { IEventFilter, FilterCondition } from './event-filter.interface';

/**
 * 事件过滤器实现
 *
 * @description 事件过滤器的具体实现，支持事件过滤和路由
 *
 * ## 业务规则
 *
 * ### 过滤职责
 * - 根据条件过滤事件
 * - 支持租户隔离
 * - 提供性能优化
 * - 支持动态配置
 *
 * ### 过滤规则
 * - 支持多种比较操作符
 * - 支持复合条件
 * - 支持租户过滤
 * - 支持事件类型过滤
 */
@Injectable()
export class EventFilter implements IEventFilter {
  private conditions: FilterCondition[] = [];
  private tenantFilter?: string;

  constructor() {}

  /**
   * 检查是否应该处理事件
   *
   * @description 检查事件是否满足过滤条件
   * @param event - 要检查的事件
   * @returns 是否应该处理
   */
  shouldProcess(event: DomainEvent): boolean {
    try {
      // 检查租户过滤
      if (this.tenantFilter && event.tenantId !== this.tenantFilter) {
        return false;
      }

      // 检查所有过滤条件
      for (const condition of this.conditions) {
        if (!this.evaluateCondition(event, condition)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to check if event should be processed', {
        eventType: event.eventType,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * 过滤事件列表
   *
   * @description 从事件列表中过滤出符合条件的事件
   * @param events - 事件列表
   * @returns 过滤后的事件列表
   */
  filterEvents(events: DomainEvent[]): DomainEvent[] {
    try {
      return events.filter((event) => this.shouldProcess(event));
    } catch (error) {
      console.error('Failed to filter events', {
        eventCount: events.length,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * 添加过滤条件
   *
   * @description 添加新的过滤条件
   * @param condition - 过滤条件
   * @returns 添加结果
   */
  addCondition(condition: FilterCondition): void {
    try {
      // 检查是否已存在相同字段的条件
      const existingIndex = this.conditions.findIndex(
        (c) => c.field === condition.field
      );

      if (existingIndex >= 0) {
        // 替换现有条件
        this.conditions[existingIndex] = condition;
      } else {
        // 添加新条件
        this.conditions.push(condition);
      }

      console.log('Filter condition added', {
        field: condition.field,
        operator: condition.operator,
        value: condition.value,
      });
    } catch (error) {
      console.error('Failed to add filter condition', {
        condition,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 移除过滤条件
   *
   * @description 移除指定的过滤条件
   * @param field - 字段名
   * @returns 移除结果
   */
  removeCondition(field: string): void {
    try {
      const initialLength = this.conditions.length;
      this.conditions = this.conditions.filter((c) => c.field !== field);

      console.log('Filter condition removed', {
        field,
        removed: initialLength - this.conditions.length,
      });
    } catch (error) {
      console.error('Failed to remove filter condition', {
        field,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 清空过滤条件
   *
   * @description 清空所有过滤条件
   * @returns 清空结果
   */
  clearConditions(): void {
    try {
      const conditionCount = this.conditions.length;
      this.conditions = [];

      console.log('Filter conditions cleared', {
        clearedCount: conditionCount,
      });
    } catch (error) {
      console.error('Failed to clear filter conditions', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 获取过滤条件
   *
   * @description 获取当前的过滤条件列表
   * @returns 过滤条件列表
   */
  getConditions(): FilterCondition[] {
    return [...this.conditions];
  }

  /**
   * 设置租户过滤
   *
   * @description 设置租户过滤条件
   * @param tenantId - 租户ID
   * @returns 设置结果
   */
  setTenantFilter(tenantId: string): void {
    try {
      this.tenantFilter = tenantId;
      console.log('Tenant filter set', { tenantId });
    } catch (error) {
      console.error('Failed to set tenant filter', {
        tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 清除租户过滤
   *
   * @description 清除租户过滤条件
   * @returns 清除结果
   */
  clearTenantFilter(): void {
    try {
      this.tenantFilter = undefined;
      console.log('Tenant filter cleared');
    } catch (error) {
      console.error('Failed to clear tenant filter', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ========== 私有辅助方法 ==========

  /**
   * 评估过滤条件
   *
   * @description 评估事件是否满足过滤条件
   * @param event - 事件
   * @param condition - 过滤条件
   * @returns 是否满足条件
   * @private
   */
  private evaluateCondition(
    event: DomainEvent,
    condition: FilterCondition
  ): boolean {
    try {
      const fieldValue = this.getFieldValue(event, condition.field);

      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'contains':
          return String(fieldValue).includes(String(condition.value));
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value);
        case 'less_than':
          return Number(fieldValue) < Number(condition.value);
        case 'in':
          return (
            Array.isArray(condition.value) &&
            condition.value.includes(fieldValue)
          );
        case 'not_in':
          return (
            Array.isArray(condition.value) &&
            !condition.value.includes(fieldValue)
          );
        default:
          console.warn(`Unknown filter operator: ${condition.operator}`);
          return true;
      }
    } catch (error) {
      console.error('Failed to evaluate filter condition', {
        field: condition.field,
        operator: condition.operator,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * 获取字段值
   *
   * @description 从事件中获取指定字段的值
   * @param event - 事件
   * @param field - 字段名
   * @returns 字段值
   * @private
   */
  private getFieldValue(event: DomainEvent, field: string): any {
    // 支持嵌套字段访问，如 'data.userId'
    const fields = field.split('.');
    let value: any = event;

    for (const f of fields) {
      if (value && typeof value === 'object' && f in value) {
        value = value[f];
      } else {
        return undefined;
      }
    }

    return value;
  }
}
