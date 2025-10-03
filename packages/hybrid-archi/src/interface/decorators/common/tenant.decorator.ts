/**
 * 通用租户装饰器
 *
 * @description 租户相关装饰器
 * @since 1.0.0
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from '@hl8/fastify-pro';

/**
 * 当前租户装饰器
 *
 * @description 从请求中提取当前租户信息
 * @returns 参数装饰器
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    return request['tenantId'];
  }
);

/**
 * 当前用户装饰器
 *
 * @description 从请求中提取当前用户信息
 * @returns 参数装饰器
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    return request['user'];
  }
);

/**
 * 租户上下文装饰器
 *
 * @description 从请求中提取租户上下文信息
 * @returns 参数装饰器
 */
export const TenantContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    return {
      tenantId: request['tenantId'],
      userId: request['user']?.id,
      userRoles: request['user']?.roles || [],
      userPermissions: request['user']?.permissions || [],
    };
  }
);
