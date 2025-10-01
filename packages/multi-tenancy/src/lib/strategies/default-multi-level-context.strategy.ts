/**
 * 默认多层级上下文策略
 *
 * 提供默认的多层级上下文提取和管理策略
 * 支持从HTTP请求中提取多层级上下文信息
 *
 * @fileoverview 默认多层级上下文策略实现
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { PinoLogger } from '@hl8/logger';
import { IMultiLevelContext } from '../types/multi-level.types';
import { IMultiLevelContextStrategy } from './multi-level-isolation-strategy.interface';

/**
 * 默认多层级上下文策略
 *
 * 实现默认的多层级上下文提取和管理策略
 *
 * @description 默认策略从HTTP请求头中提取多层级上下文信息
 * 支持标准的HTTP头格式和自定义头格式
 *
 * ## 业务规则
 *
 * ### 上下文提取规则
 * - 租户ID：从 `X-Tenant-ID` 请求头中提取
 * - 组织ID：从 `X-Organization-ID` 请求头中提取
 * - 部门ID：从 `X-Department-ID` 请求头中提取
 * - 用户ID：从 `X-User-ID` 请求头中提取
 * - 请求ID：从 `X-Request-ID` 请求头中提取
 *
 * ### 隔离级别确定规则
 * - 如果只有租户ID：隔离级别为 'tenant'
 * - 如果有租户ID和组织ID：隔离级别为 'organization'
 * - 如果有租户ID、组织ID和部门ID：隔离级别为 'department'
 * - 如果有完整的层级信息：隔离级别为 'user'
 *
 * ### 上下文验证规则
 * - 租户ID是必填字段
 * - 组织ID必须属于指定租户
 * - 部门ID必须属于指定组织
 * - 用户ID必须属于指定部门
 * - 层级关系必须符合业务逻辑
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class ExampleService {
 *   constructor(
 *     private readonly contextStrategy: DefaultMultiLevelContextStrategy
 *   ) {}
 *
 *   async handleRequest(request: FastifyRequest) {
 *     // 从请求中提取多层级上下文
 *     const context = await this.contextStrategy.extractContext(request);
 *     if (context) {
 *       console.log('租户ID:', context.tenantId);
 *       console.log('组织ID:', context.organizationId);
 *       console.log('隔离级别:', context.isolationLevel);
 *     }
 *   }
 * }
 * ```
 */
@Injectable()
export class DefaultMultiLevelContextStrategy
  implements IMultiLevelContextStrategy
{
  constructor(private readonly logger: PinoLogger = new PinoLogger()) {
    this.logger.setContext({
      requestId: 'default-multi-level-context-strategy',
    });
  }

  /**
   * 提取多层级上下文
   *
   * 从HTTP请求中提取多层级上下文信息
   *
   * @param request HTTP请求对象
   * @returns 多层级上下文或null
   */
  async extractContext(
    request: FastifyRequest
  ): Promise<IMultiLevelContext | null> {
    try {
      // 从请求头中提取层级信息
      const tenantId = this.extractHeaderValue(request, 'X-Tenant-ID');
      const organizationId = this.extractHeaderValue(
        request,
        'X-Organization-ID'
      );
      const departmentId = this.extractHeaderValue(request, 'X-Department-ID');
      const userId = this.extractHeaderValue(request, 'X-User-ID');
      const requestId = this.extractHeaderValue(request, 'X-Request-ID');

      // 租户ID是必填字段
      if (!tenantId) {
        this.logger.debug('未找到租户ID，跳过多层级上下文提取');
        return null;
      }

      // 确定隔离级别
      const isolationLevel = this.determineIsolationLevel(
        tenantId,
        organizationId,
        departmentId,
        userId
      );

      const context: IMultiLevelContext = {
        tenantId,
        organizationId,
        departmentId,
        userId,
        requestId,
        isolationLevel,
        timestamp: new Date(),
      };

      this.logger.debug('提取多层级上下文成功', {
        context,
        requestHeaders: this.getRelevantHeaders(request),
      });

      return context;
    } catch (error) {
      this.logger.error('提取多层级上下文失败', {
        error: (error as Error).message,
        requestInfo: this.getRequestInfo(request),
      });
      return null;
    }
  }

  /**
   * 验证多层级上下文
   *
   * 验证多层级上下文的完整性和有效性
   *
   * @param context 多层级上下文
   * @returns 验证是否成功
   */
  async validateContext(context: IMultiLevelContext): Promise<boolean> {
    try {
      // 基础验证
      if (!context.tenantId) {
        this.logger.debug('多层级上下文验证失败：缺少租户ID');
        return false;
      }

      if (!context.timestamp) {
        this.logger.debug('多层级上下文验证失败：缺少时间戳');
        return false;
      }

      // 验证层级关系
      if (context.organizationId && !context.tenantId) {
        this.logger.debug('多层级上下文验证失败：组织ID存在但租户ID不存在');
        return false;
      }

      if (context.departmentId && !context.organizationId) {
        this.logger.debug('多层级上下文验证失败：部门ID存在但组织ID不存在');
        return false;
      }

      if (context.userId && !context.departmentId) {
        this.logger.debug('多层级上下文验证失败：用户ID存在但部门ID不存在');
        return false;
      }

      // 验证隔离级别
      const expectedLevel = this.determineIsolationLevel(
        context.tenantId,
        context.organizationId,
        context.departmentId,
        context.userId
      );

      if (context.isolationLevel !== expectedLevel) {
        this.logger.debug('多层级上下文验证失败：隔离级别不匹配', {
          expected: expectedLevel,
          actual: context.isolationLevel,
        });
        return false;
      }

      this.logger.debug('多层级上下文验证成功', { context });
      return true;
    } catch (error) {
      this.logger.error('多层级上下文验证失败', {
        context,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * 构建多层级上下文
   *
   * 根据层级信息构建完整的多层级上下文
   *
   * @param tenantId 租户ID
   * @param organizationId 组织ID（可选）
   * @param departmentId 部门ID（可选）
   * @param userId 用户ID（可选）
   * @returns 多层级上下文
   */
  async buildContext(
    tenantId: string,
    organizationId?: string,
    departmentId?: string,
    userId?: string
  ): Promise<IMultiLevelContext> {
    try {
      // 验证必填字段
      if (!tenantId) {
        throw new Error('租户ID是必填字段');
      }

      // 确定隔离级别
      const isolationLevel = this.determineIsolationLevel(
        tenantId,
        organizationId,
        departmentId,
        userId
      );

      const context: IMultiLevelContext = {
        tenantId,
        organizationId,
        departmentId,
        userId,
        isolationLevel,
        timestamp: new Date(),
      };

      // 验证构建的上下文
      const isValid = await this.validateContext(context);
      if (!isValid) {
        throw new Error('构建的多层级上下文无效');
      }

      this.logger.debug('构建多层级上下文成功', { context });
      return context;
    } catch (error) {
      this.logger.error('构建多层级上下文失败', {
        tenantId,
        organizationId,
        departmentId,
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取上下文配置
   *
   * 获取上下文策略的配置信息
   *
   * @returns 上下文配置
   */
  getContextConfig(): Record<string, unknown> {
    return {
      strategy: 'default-multi-level-context',
      headers: {
        tenantId: 'X-Tenant-ID',
        organizationId: 'X-Organization-ID',
        departmentId: 'X-Department-ID',
        userId: 'X-User-ID',
        requestId: 'X-Request-ID',
      },
      validation: {
        requireTenantId: true,
        validateHierarchy: true,
        validateIsolationLevel: true,
      },
    };
  }

  /**
   * 确定隔离级别
   *
   * 根据层级信息确定隔离级别
   *
   * @private
   */
  private determineIsolationLevel(
    tenantId: string,
    organizationId?: string,
    departmentId?: string,
    userId?: string
  ): 'tenant' | 'organization' | 'department' | 'user' {
    if (userId && departmentId && organizationId && tenantId) {
      return 'user';
    } else if (departmentId && organizationId && tenantId) {
      return 'department';
    } else if (organizationId && tenantId) {
      return 'organization';
    } else if (tenantId) {
      return 'tenant';
    } else {
      throw new Error('无法确定隔离级别：缺少必要的层级信息');
    }
  }

  /**
   * 从请求中提取头值
   *
   * @private
   */
  private extractHeaderValue(
    request: FastifyRequest,
    headerName: string
  ): string | undefined {
    if (!request || !request.headers) {
      return undefined;
    }

    // 尝试不同的头名称格式
    const variations = [
      headerName,
      headerName.toLowerCase(),
      headerName.replace(/-/g, '_'),
      headerName.replace(/-/g, '_').toLowerCase(),
    ];

    for (const variation of variations) {
      const value = request.headers[variation];
      if (value && typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return undefined;
  }

  /**
   * 获取相关请求头
   *
   * @private
   */
  private getRelevantHeaders(request: FastifyRequest): Record<string, string> {
    if (!request || !request.headers) {
      return {};
    }

    const relevantHeaders = [
      'X-Tenant-ID',
      'X-Organization-ID',
      'X-Department-ID',
      'X-User-ID',
      'X-Request-ID',
    ];

    const result: Record<string, string> = {};
    for (const header of relevantHeaders) {
      const value = this.extractHeaderValue(request, header);
      if (value) {
        result[header] = value;
      }
    }

    return result;
  }

  /**
   * 获取请求信息
   *
   * @private
   */
  private getRequestInfo(request: FastifyRequest): Record<string, unknown> {
    if (!request) {
      return { error: 'Request is null or undefined' };
    }

    return {
      method: request.method,
      url: request.url,
      headers: request.headers ? Object.keys(request.headers) : [],
      hasHeaders: !!request.headers,
    };
  }
}
