/**
 * 权限控制守卫
 *
 * @description 为控制器提供权限控制功能
 * 支持基于角色的访问控制（RBAC）和基于属性的访问控制（ABAC）
 *
 * @since 1.0.0
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ILoggerService, IUserContext } from '../../shared/interfaces';

/**
 * 权限控制守卫
 *
 * @description 实现权限检查功能
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: IPermissionService,
    private readonly logger: ILoggerService
  ) {}

  /**
   * 权限检查
   *
   * @description 检查用户是否具有所需权限
   *
   * @param context - 执行上下文
   * @returns 是否通过权限检查
   * @throws {ForbiddenException} 权限不足
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as IUserContext;

    if (!user) {
      throw new ForbiddenException('用户未认证');
    }

    // 1. 获取所需权限
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      'permissions',
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // 无权限要求
    }

    try {
      // 2. 检查用户权限
      const hasPermission = await this.permissionService.hasAnyPermission(
        user.userId,
        requiredPermissions,
        user.tenantId
      );

      if (!hasPermission) {
        this.logger.warn('权限检查失败', {
          userId: user.userId,
          requiredPermissions,
          userPermissions: user.permissions,
          traceId: request.traceId,
        });

        throw new ForbiddenException('权限不足');
      }

      this.logger.debug('权限检查通过', {
        userId: user.userId,
        requiredPermissions,
        traceId: request.traceId,
      });

      return true;
    } catch (error) {
      this.logger.error('权限检查异常', {
        userId: user.userId,
        requiredPermissions,
        error: error instanceof Error ? error.message : String(error),
        traceId: request.traceId,
      });

      throw error;
    }
  }
}

/**
 * 权限服务接口
 *
 * @description 定义权限服务的基本接口
 */
export interface IPermissionService {
  hasAnyPermission(
    userId: string,
    permissions: string[],
    tenantId: string
  ): Promise<boolean>;
}
