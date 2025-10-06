/**
 * 通用GraphQL解析器基类
 *
 * @description 提供通用的GraphQL查询和变更操作
 * @since 1.0.0
 */

// import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';

/**
 * 通用GraphQL响应接口
 *
 * @description GraphQL操作的统一响应格式
 */
export interface IGraphQLResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * 分页参数接口
 *
 * @description GraphQL分页查询的参数
 */
export interface IPaginationArgs {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 通用GraphQL解析器基类
 *
 * @description 提供通用的GraphQL查询和变更操作
 *
 * ## 功能特性
 *
 * ### 查询操作
 * - 单个资源查询
 * - 列表查询
 * - 分页查询
 * - 搜索查询
 *
 * ### 变更操作
 * - 创建资源
 * - 更新资源
 * - 删除资源
 * - 批量操作
 *
 * ### 响应处理
 * - 统一响应格式
 * - 错误处理
 * - 分页支持
 * - 上下文管理
 */
export abstract class BaseResolver {
  /**
   * 创建成功响应
   *
   * @description 创建GraphQL操作成功的响应
   * @param data - 响应数据
   * @param message - 响应消息
   * @returns GraphQL响应
   */
  protected createSuccessResponse<T>(
    data: T,
    message = '操作成功'
  ): IGraphQLResponse<T> {
    return {
      success: true,
      data,
      message,
    };
  }

  /**
   * 创建错误响应
   *
   * @description 创建GraphQL操作失败的响应
   * @param error - 错误信息
   * @returns GraphQL响应
   */
  protected createErrorResponse(error: string): IGraphQLResponse {
    return {
      success: false,
      error,
    };
  }

  /**
   * 验证分页参数
   *
   * @description 验证和标准化分页参数
   * @param args - 分页参数
   * @returns 标准化后的参数
   */
  protected validatePaginationArgs(args: IPaginationArgs): {
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    sortOrder: 'asc' | 'desc';
  } {
    const page = Math.max(1, args.page || 1);
    const limit = Math.min(100, Math.max(1, args.limit || 10));
    const sortOrder = args.sortOrder === 'desc' ? 'desc' : 'asc';

    return {
      page,
      limit,
      search: args.search,
      sortBy: args.sortBy,
      sortOrder,
    };
  }

  /**
   * 获取用户上下文
   *
   * @description 从GraphQL上下文获取用户信息
   * @param context - GraphQL上下文
   * @returns 用户信息
   */
  protected getUserFromContext(context: { req?: { user?: unknown }; user?: unknown }): unknown {
    return context.req?.user || context.user;
  }

  /**
   * 获取租户上下文
   *
   * @description 从GraphQL上下文获取租户信息
   * @param context - GraphQL上下文
   * @returns 租户信息
   */
  protected getTenantFromContext(context: { req?: { tenantId?: string }; tenantId?: string }): string | undefined {
    return context.req?.tenantId || context.tenantId;
  }
}
