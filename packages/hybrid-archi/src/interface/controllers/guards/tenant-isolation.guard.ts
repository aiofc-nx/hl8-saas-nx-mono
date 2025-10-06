/**
 * 租户隔离守卫
 *
 * @description 为控制器提供租户隔离功能
 * 确保多租户环境下的数据安全和隔离
 *
 * @since 1.0.0
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ILoggerService, IUserContext } from '../../shared/interfaces';

/**
 * 租户隔离守卫
 *
 * @description 实现租户数据隔离
 */
@Injectable()
export class TenantIsolationGuard implements CanActivate {
  constructor(
    private readonly tenantService: ITenantService,
    private readonly logger: ILoggerService
  ) {}

  /**
   * 租户隔离检查
   *
   * @description 检查租户隔离规则
   *
   * @param context - 执行上下文
   * @returns 是否通过租户隔离检查
   * @throws {ForbiddenException} 租户隔离检查失败
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as IUserContext;

    if (!user) {
      throw new ForbiddenException('用户未认证');
    }

    try {
      // 1. 获取请求中的租户信息
      const requestTenantId = this.extractTenantId(request);

      // 2. 验证用户是否属于该租户
      if (requestTenantId && requestTenantId !== user.tenantId) {
        // 检查用户是否有跨租户权限
        const hasCrossTenantAccess =
          await this.tenantService.hasCrossTenantAccess(
            user.userId,
            requestTenantId
          );

        if (!hasCrossTenantAccess) {
          throw new ForbiddenException('无权限访问其他租户数据');
        }
      }

      // 3. 设置租户上下文
      const tenantContext = new TenantContextInfo(
        requestTenantId || user.tenantId,
        user.tenantId === requestTenantId ? 'owner' : 'guest'
      );

      request.tenantContext = tenantContext;

      // 4. 设置租户上下文管理器
      TenantContextManager.setCurrentTenant(tenantContext);

      this.logger.debug('租户隔离检查通过', {
        userId: user.userId,
        userTenantId: user.tenantId,
        requestTenantId: requestTenantId,
        traceId: request.traceId,
      });

      return true;
    } catch (error) {
      this.logger.error('租户隔离检查失败', {
        userId: user.userId,
        error: error instanceof Error ? error.message : String(error),
        traceId: request.traceId,
      });

      throw error;
    }
  }

  /**
   * 提取租户ID
   *
   * @description 从请求中提取租户ID
   *
   * @param request - HTTP请求
   * @returns 租户ID或null
   */
  private extractTenantId(request: { 
    params?: { tenantId?: string }; 
    query?: { tenantId?: string }; 
    body?: { tenantId?: string }; 
    headers?: { 'x-tenant-id'?: string } 
  }): string | null {
    // 从多个位置提取租户ID
    return (
      request.params?.tenantId ||
      request.query?.tenantId ||
      request.body?.tenantId ||
      request.headers?.['x-tenant-id'] ||
      null
    );
  }
}

/**
 * 租户上下文信息
 *
 * @description 定义租户上下文的数据结构
 */
export class TenantContextInfo {
  constructor(
    public readonly tenantId: string,
    public readonly accessLevel: 'owner' | 'guest'
  ) {}
}

/**
 * 租户上下文管理器
 *
 * @description 管理租户上下文信息
 */
export class TenantContextManager {
  private static currentTenant: TenantContextInfo | null = null;

  /**
   * 设置当前租户
   *
   * @description 设置当前请求的租户上下文
   *
   * @param tenantContext - 租户上下文
   */
  static setCurrentTenant(tenantContext: TenantContextInfo): void {
    this.currentTenant = tenantContext;
  }

  /**
   * 获取当前租户
   *
   * @description 获取当前请求的租户上下文
   *
   * @returns 租户上下文或null
   */
  static getCurrentTenant(): TenantContextInfo | null {
    return this.currentTenant;
  }

  /**
   * 清除租户上下文
   *
   * @description 清除当前请求的租户上下文
   */
  static clearTenantContext(): void {
    this.currentTenant = null;
  }
}

/**
 * 租户服务接口
 *
 * @description 定义租户服务的基本接口
 */
export interface ITenantService {
  hasCrossTenantAccess(userId: string, tenantId: string): Promise<boolean>;
}
