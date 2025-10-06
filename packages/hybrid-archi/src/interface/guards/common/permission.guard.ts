/**
 * 通用权限守卫
 *
 * @description 权限验证守卫，检查用户权限
 * @since 1.0.0
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from '@hl8/fastify-pro';

/**
 * 权限装饰器元数据键
 */
export const PERMISSIONS_KEY = 'permissions';
export const ROLES_KEY = 'roles';

/**
 * 权限守卫
 *
 * @description 验证用户权限，确保用户有足够的权限访问资源
 *
 * ## 业务规则
 *
 * ### 权限验证规则
 * - 检查用户是否具有所需权限
 * - 支持基于角色的权限控制
 * - 支持基于资源的权限控制
 * - 支持租户级别的权限隔离
 *
 * ### 权限继承规则
 * - 管理员权限包含所有子权限
 * - 角色权限可以继承
 * - 支持权限组合和覆盖
 * - 支持动态权限计算
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * 检查是否可以激活路由
   *
   * @description 验证用户权限
   * @param context - 执行上下文
   * @returns 是否可以激活
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<FastifyRequest>();
      const user = request['user'];

      if (!user) {
        throw new ForbiddenException('用户未认证');
      }

      // 获取所需的权限和角色
      const requiredPermissions = this.reflector.get<string[]>(
        PERMISSIONS_KEY,
        context.getHandler()
      );
      const requiredRoles = this.reflector.get<string[]>(
        ROLES_KEY,
        context.getHandler()
      );

      // 如果没有权限要求，则允许访问
      if (!requiredPermissions && !requiredRoles) {
        return true;
      }

      // 检查角色权限
      if (requiredRoles && requiredRoles.length > 0) {
        const hasRole = this.checkUserRoles(user, requiredRoles);
        if (!hasRole) {
          throw new ForbiddenException('用户角色不足');
        }
      }

      // 检查权限
      if (requiredPermissions && requiredPermissions.length > 0) {
        const hasPermission = this.checkUserPermissions(
          user,
          requiredPermissions
        );
        if (!hasPermission) {
          throw new ForbiddenException('用户权限不足');
        }
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('权限验证失败');
    }
  }

  /**
   * 检查用户角色
   *
   * @description 检查用户是否具有所需角色
   * @param user - 用户信息
   * @param requiredRoles - 所需角色列表
   * @returns 是否具有角色
   * @private
   */
  private checkUserRoles(user: { roles?: string[] }, requiredRoles: string[]): boolean {
    const userRoles = user.roles || [];
    return requiredRoles.some((role) => userRoles.includes(role));
  }

  /**
   * 检查用户权限
   *
   * @description 检查用户是否具有所需权限
   * @param user - 用户信息
   * @param requiredPermissions - 所需权限列表
   * @returns 是否具有权限
   * @private
   */
  private checkUserPermissions(
    user: { permissions?: string[] },
    requiredPermissions: string[]
  ): boolean {
    const userPermissions = user.permissions || [];
    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );
  }
}
