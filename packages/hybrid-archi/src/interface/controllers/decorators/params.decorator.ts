/**
 * 参数提取装饰器
 *
 * @description 为控制器方法提供参数提取功能
 * 支持从请求中提取用户信息、租户信息、追踪信息等
 *
 * @since 1.0.0
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 当前用户装饰器
 *
 * @description 从请求中提取当前用户信息
 *
 * @returns 参数装饰器
 */
export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);

/**
 * 租户上下文装饰器
 *
 * @description 从请求中提取租户上下文信息
 *
 * @returns 参数装饰器
 */
export const TenantContext = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantContext;
  }
);

/**
 * 请求追踪ID装饰器
 *
 * @description 从请求中提取追踪ID
 *
 * @returns 参数装饰器
 */
export const TraceId = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.traceId || request.headers['x-trace-id'];
  }
);

/**
 * 关联ID装饰器
 *
 * @description 从请求中提取关联ID
 *
 * @returns 参数装饰器
 */
export const CorrelationId = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.correlationId || request.headers['x-correlation-id'];
  }
);

/**
 * 客户端信息装饰器
 *
 * @description 从请求中提取客户端信息
 *
 * @returns 参数装饰器
 */
export const ClientInfo = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return {
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      referer: request.headers.referer,
    };
  }
);
