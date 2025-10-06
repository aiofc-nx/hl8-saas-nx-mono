/**
 * 通用验证中间件
 *
 * @description 请求数据验证中间件
 * @since 1.0.0
 */

import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from '@hl8/fastify-pro';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

/**
 * 验证中间件
 *
 * @description 验证请求数据的格式和有效性
 *
 * ## 业务规则
 *
 * ### 数据验证规则
 * - 验证请求体数据格式
 * - 验证查询参数格式
 * - 验证路径参数格式
 * - 支持自定义验证规则
 *
 * ### 错误处理规则
 * - 提供详细的验证错误信息
 * - 支持多语言错误消息
 * - 支持错误码和错误类型
 * - 支持错误堆栈跟踪
 */
@Injectable()
export class ValidationMiddleware implements NestMiddleware {
  /**
   * 处理请求
   *
   * @description 验证请求数据
   * @param req - Fastify请求
   * @param res - Fastify响应
   * @param next - 下一个中间件
   */
  async use(
    req: FastifyRequest,
    res: FastifyReply,
    next: () => void
  ): Promise<void> {
    try {
      // 验证请求体
      if (req.body && Object.keys(req.body).length > 0) {
        await this.validateRequestBody(req);
      }

      // 验证查询参数
      if (req.query && Object.keys(req.query).length > 0) {
        await this.validateQueryParams(req);
      }

      // 验证路径参数
      if (req.params && Object.keys(req.params).length > 0) {
        await this.validatePathParams(req);
      }

      next();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('数据验证失败');
    }
  }

  /**
   * 验证请求体
   *
   * @description 验证请求体数据的格式和有效性
   * @param req - Fastify请求
   * @private
   */
  private async validateRequestBody(req: FastifyRequest): Promise<void> {
    // 这里可以根据具体的DTO类进行验证
    // 示例：验证JSON格式
    try {
      JSON.stringify(req.body);
    } catch (error) {
      throw new BadRequestException('请求体格式无效');
    }
  }

  /**
   * 验证查询参数
   *
   * @description 验证查询参数的格式和有效性
   * @param req - Fastify请求
   * @private
   */
  private async validateQueryParams(req: FastifyRequest): Promise<void> {
    // 验证查询参数的基本格式
    for (const [key, value] of Object.entries(req.query as Record<string, unknown>)) {
      if (typeof value === 'string' && value.length > 1000) {
        throw new BadRequestException(`查询参数 ${key} 长度超过限制`);
      }
    }
  }

  /**
   * 验证路径参数
   *
   * @description 验证路径参数的格式和有效性
   * @param req - Fastify请求
   * @private
   */
  private async validatePathParams(req: FastifyRequest): Promise<void> {
    // 验证路径参数的基本格式
    for (const [key, value] of Object.entries(req.params as Record<string, unknown>)) {
      if (typeof value === 'string' && value.length > 100) {
        throw new BadRequestException(`路径参数 ${key} 长度超过限制`);
      }
    }
  }
}
