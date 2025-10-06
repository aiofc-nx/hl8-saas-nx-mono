/**
 * 通用REST控制器基类
 *
 * @description 提供通用的CRUD操作和响应处理
 * @since 1.0.0
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  HttpException,
} from '@nestjs/common';

/**
 * 通用响应接口
 *
 * @description 统一的API响应格式
 */
export interface IApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: Date;
}

/**
 * 分页查询参数接口
 *
 * @description 分页查询的通用参数
 */
export interface IPaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分页响应接口
 *
 * @description 分页查询的响应格式
 */
export interface IPaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 通用REST控制器基类
 *
 * @description 提供通用的CRUD操作和响应处理
 *
 * ## 功能特性
 *
 * ### CRUD操作
 * - 创建资源
 * - 查询资源
 * - 更新资源
 * - 删除资源
 * - 列表查询
 *
 * ### 响应处理
 * - 统一响应格式
 * - 错误处理
 * - 分页支持
 * - 状态码管理
 */
export abstract class BaseController {
  /**
   * 创建成功响应
   *
   * @description 创建操作成功的响应
   * @param data - 响应数据
   * @param message - 响应消息
   * @returns API响应
   */
  protected createSuccessResponse<T>(
    data: T,
    message = '操作成功'
  ): IApiResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date(),
    };
  }

  /**
   * 创建错误响应
   *
   * @description 创建操作失败的响应
   * @param error - 错误信息
   * @param statusCode - HTTP状态码
   * @returns API响应
   */
  protected createErrorResponse(
    error: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST
  ): IApiResponse {
    return {
      success: false,
      error,
      timestamp: new Date(),
    };
  }

  /**
   * 创建分页响应
   *
   * @description 创建分页查询的响应
   * @param items - 数据项
   * @param total - 总数
   * @param page - 页码
   * @param limit - 每页数量
   * @returns 分页响应
   */
  protected createPaginationResponse<T>(
    items: T[],
    total: number,
    page: number,
    limit: number
  ): IPaginationResponse<T> {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
    };
  }

  /**
   * 抛出业务异常
   *
   * @description 抛出业务逻辑异常
   * @param message - 异常消息
   * @param statusCode - HTTP状态码
   */
  protected throwBusinessException(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST
  ): never {
    throw new HttpException(message, statusCode);
  }

  /**
   * 验证分页参数
   *
   * @description 验证和标准化分页参数
   * @param query - 查询参数
   * @returns 标准化后的参数
   */
  protected validatePaginationQuery(query: IPaginationQuery): {
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    sortOrder: 'asc' | 'desc';
  } {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

    return {
      page,
      limit,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder,
    };
  }
}
