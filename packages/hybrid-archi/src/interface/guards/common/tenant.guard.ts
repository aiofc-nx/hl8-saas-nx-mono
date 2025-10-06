/**
 * 通用租户守卫
 *
 * @description 租户隔离守卫，确保多租户数据隔离
 * @since 1.0.0
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { FastifyRequest } from '@hl8/fastify-pro';

/**
 * 租户守卫
 *
 * @description 验证租户信息，确保多租户数据隔离
 *
 * ## 业务规则
 *
 * ### 租户隔离规则
 * - 验证租户ID的有效性
 * - 确保用户属于正确的租户
 * - 支持跨租户访问控制
 * - 支持租户级别的权限验证
 *
 * ### 租户验证规则
 * - 租户ID必须存在且有效
 * - 用户必须属于指定租户
 * - 支持租户切换和验证
 * - 支持租户级别的资源访问
 */
@Injectable()
export class TenantGuard implements CanActivate {
  /**
   * 检查是否可以激活路由
   *
   * @description 验证租户信息
   * @param context - 执行上下文
   * @returns 是否可以激活
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<FastifyRequest>();
      const user = request['user'];

      if (!user) {
        throw new BadRequestException('用户未认证');
      }

      // 从请求中获取租户ID
      const tenantId = this.extractTenantId(request);
      if (!tenantId) {
        throw new BadRequestException('未提供租户ID');
      }

      // 验证租户ID格式
      if (!this.isValidTenantId(tenantId)) {
        throw new BadRequestException('无效的租户ID格式');
      }

      // 验证用户是否属于该租户
      if (!this.isUserInTenant(user, tenantId)) {
        throw new BadRequestException('用户不属于指定租户');
      }

      // 设置租户上下文
      request['tenantId'] = tenantId;
      request['tenantContext'] = {
        tenantId,
        userId: user.id,
        userRoles: user.roles || [],
        userPermissions: user.permissions || [],
      };

      return true;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('租户验证失败');
    }
  }

  /**
   * 从请求中提取租户ID
   *
   * @description 从请求头、查询参数或路径参数中提取租户ID
   * @param request - Fastify请求
   * @returns 租户ID
   * @private
   */
  private extractTenantId(request: FastifyRequest): string | null {
    // 1. 从请求头获取
    const headerTenantId = request.headers['x-tenant-id'] as string;
    if (headerTenantId) {
      return headerTenantId;
    }

    // 2. 从查询参数获取
    const queryTenantId = (request.query as { tenantId?: string })?.tenantId;
    if (queryTenantId) {
      return queryTenantId;
    }

    // 3. 从路径参数获取
    const pathTenantId = (request.params as { tenantId?: string })?.tenantId;
    if (pathTenantId) {
      return pathTenantId;
    }

    return null;
  }

  /**
   * 验证租户ID格式
   *
   * @description 验证租户ID是否符合格式要求
   * @param tenantId - 租户ID
   * @returns 是否有效
   * @private
   */
  private isValidTenantId(tenantId: string): boolean {
    // UUID格式验证
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(tenantId);
  }

  /**
   * 检查用户是否属于租户
   *
   * @description 验证用户是否属于指定租户
   * @param user - 用户信息
   * @param tenantId - 租户ID
   * @returns 是否属于租户
   * @private
   */
  private isUserInTenant(user: { tenants?: string[] }, tenantId: string): boolean {
    const userTenants = user.tenants || [];
    return userTenants.includes(tenantId);
  }
}
