/**
 * 上下文服务
 *
 * @description 基于nestjs-cls的上下文管理服务
 * 提供租户、用户、请求等上下文信息的透明管理
 *
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { PinoLogger } from '@hl8/logger';
import { IContextManager } from './types/cache.types';

/**
 * 上下文服务
 *
 * @description 提供基于nestjs-cls的上下文管理功能
 */
@Injectable()
export class ContextService implements IContextManager {
  constructor(
    private readonly cls: ClsService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext({ requestId: 'context-service' });
  }

  /**
   * 设置租户ID
   *
   * @description 在当前上下文中设置租户ID
   */
  setTenant(tenantId: string): void {
    try {
      this.cls.set('tenantId', tenantId);
      this.logger.debug('租户上下文已设置', { tenantId });
    } catch (error) {
      this.logger.error('设置租户上下文失败', {
        tenantId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取租户ID
   *
   * @description 从当前上下文获取租户ID
   */
  getTenant(): string | null {
    try {
      const tenantId = this.cls.get<string>('tenantId');
      return tenantId || null;
    } catch (error) {
      this.logger.error('获取租户上下文失败', {
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * 设置用户ID
   *
   * @description 在当前上下文中设置用户ID
   */
  setUser(userId: string): void {
    try {
      this.cls.set('userId', userId);
      this.logger.debug('用户上下文已设置', { userId });
    } catch (error) {
      this.logger.error('设置用户上下文失败', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取用户ID
   *
   * @description 从当前上下文获取用户ID
   */
  getUser(): string | null {
    try {
      const userId = this.cls.get<string>('userId');
      return userId || null;
    } catch (error) {
      this.logger.error('获取用户上下文失败', {
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * 设置请求ID
   *
   * @description 在当前上下文中设置请求ID
   */
  setRequestId(requestId: string): void {
    try {
      this.cls.set('requestId', requestId);
      this.logger.debug('请求上下文已设置', { requestId });
    } catch (error) {
      this.logger.error('设置请求上下文失败', {
        requestId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取请求ID
   *
   * @description 从当前上下文获取请求ID
   */
  getRequestId(): string | null {
    try {
      const requestId = this.cls.get<string>('requestId');
      return requestId || null;
    } catch (error) {
      this.logger.error('获取请求上下文失败', {
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * 设置自定义上下文
   *
   * @description 在当前上下文中设置自定义键值对
   */
  setContext(key: string, value: any): void {
    try {
      this.cls.set(key, value);
      this.logger.debug('自定义上下文已设置', { key });
    } catch (error) {
      this.logger.error('设置自定义上下文失败', {
        key,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取自定义上下文
   *
   * @description 从当前上下文获取自定义值
   */
  getContext<T = any>(key: string): T | null {
    try {
      const value = this.cls.get<T>(key);
      return (value as T) || null;
    } catch (error) {
      this.logger.error('获取自定义上下文失败', {
        key,
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * 删除自定义上下文
   *
   * @description 从当前上下文删除自定义键
   */
  deleteContext(key: string): void {
    try {
      (this.cls as any).delete(key);
      this.logger.debug('自定义上下文已删除', { key });
    } catch (error) {
      this.logger.error('删除自定义上下文失败', {
        key,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 检查上下文是否存在
   *
   * @description 检查指定的上下文键是否存在
   */
  hasContext(key: string): boolean {
    try {
      return this.cls.has(key);
    } catch (error) {
      this.logger.error('检查上下文失败', {
        key,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * 获取所有上下文
   *
   * @description 获取当前上下文中的所有键值对
   */
  getAllContext(): Record<string, any> {
    try {
      return this.cls.get();
    } catch (error) {
      this.logger.error('获取所有上下文失败', {
        error: (error as Error).message,
      });
      return {};
    }
  }

  /**
   * 清空上下文
   *
   * @description 清空当前上下文中的所有数据
   */
  clear(): void {
    try {
      (this.cls as any).clear();
      this.logger.debug('上下文已清空');
    } catch (error) {
      this.logger.error('清空上下文失败', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * 运行带上下文的函数
   *
   * @description 在指定的上下文中运行函数
   */
  async runWithContext<T>(
    context: Record<string, any>,
    fn: () => Promise<T>
  ): Promise<T> {
    try {
      return await this.cls.run(async () => {
        // 设置上下文
        for (const [key, value] of Object.entries(context)) {
          this.cls.set(key, value);
        }

        // 执行函数
        return await fn();
      });
    } catch (error) {
      this.logger.error('运行带上下文函数失败', {
        context,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 运行带租户上下文的函数
   *
   * @description 在指定的租户上下文中运行函数
   */
  async runWithTenant<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await this.runWithContext({ tenantId }, fn);
    } catch (error) {
      this.logger.error('运行带租户上下文函数失败', {
        tenantId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 运行带用户上下文的函数
   *
   * @description 在指定的用户上下文中运行函数
   */
  async runWithUser<T>(userId: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await this.runWithContext({ userId }, fn);
    } catch (error) {
      this.logger.error('运行带用户上下文函数失败', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 检查是否有租户上下文
   *
   * @description 检查当前是否有租户上下文
   */
  hasTenantContext(): boolean {
    return this.hasContext('tenantId');
  }

  /**
   * 检查是否有用户上下文
   *
   * @description 检查当前是否有用户上下文
   */
  hasUserContext(): boolean {
    return this.hasContext('userId');
  }

  /**
   * 检查是否有请求上下文
   *
   * @description 检查当前是否有请求上下文
   */
  hasRequestContext(): boolean {
    return this.hasContext('requestId');
  }

  /**
   * 获取上下文摘要
   *
   * @description 获取当前上下文的摘要信息
   */
  getContextSummary(): {
    tenantId: string | null;
    userId: string | null;
    requestId: string | null;
    hasContext: boolean;
  } {
    return {
      tenantId: this.getTenant(),
      userId: this.getUser(),
      requestId: this.getRequestId(),
      hasContext:
        this.hasTenantContext() ||
        this.hasUserContext() ||
        this.hasRequestContext(),
    };
  }

  /**
   * 验证上下文完整性
   *
   * @description 验证当前上下文是否完整
   */
  validateContext(): {
    isValid: boolean;
    missing: string[];
    errors: string[];
  } {
    const missing: string[] = [];
    const errors: string[] = [];

    // 检查租户上下文
    if (!this.hasTenantContext()) {
      missing.push('tenantId');
    }

    // 检查用户上下文
    if (!this.hasUserContext()) {
      missing.push('userId');
    }

    // 检查请求上下文
    if (!this.hasRequestContext()) {
      missing.push('requestId');
    }

    const isValid = missing.length === 0 && errors.length === 0;

    return {
      isValid,
      missing,
      errors,
    };
  }
}
