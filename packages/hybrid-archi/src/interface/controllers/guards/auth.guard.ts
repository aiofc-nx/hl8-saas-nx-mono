/**
 * JWT认证守卫
 *
 * @description 为控制器提供JWT认证功能
 * 验证JWT令牌的有效性和用户状态
 *
 * ## 业务规则
 *
 * ### 认证规则
 * - 验证JWT令牌的签名和有效期
 * - 检查用户账户状态（活跃、禁用、锁定等）
 * - 支持令牌刷新和单点登录控制
 *
 * ### 安全规则
 * - 支持令牌黑名单和撤销机制
 * - 支持多设备登录控制
 * - 支持异常登录检测和防护
 *
 * ### 性能规则
 * - 支持令牌缓存以提高性能
 * - 支持异步认证验证
 * - 支持认证结果缓存
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @UseGuards(JwtAuthGuard)
 * export class UserController {
 *   @Get()
 *   async getUsers(): Promise<UserResponseDto[]> {
 *     // 需要JWT认证
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ILoggerService,
  IUser,
  IUserContext,
  IRole,
  IPermission,
} from '../../shared/interfaces';

/**
 * JWT服务接口
 *
 * @description 定义JWT服务的基本接口
 */
export interface JwtService {
  verifyAsync(token: string, options?: unknown): Promise<unknown>;
}

/**
 * JWT认证守卫
 *
 * @description 实现JWT令牌认证
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly logger: ILoggerService
  ) {}

  /**
   * 认证检查
   *
   * @description 验证JWT令牌和用户状态
   *
   * @param context - 执行上下文
   * @returns 是否通过认证
   * @throws {UnauthorizedException} 认证失败
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const traceId = request.headers['x-trace-id'] || this.generateTraceId();

    try {
      // 1. 提取JWT令牌
      const token = this.extractTokenFromHeader(request);
      if (!token) {
        throw new UnauthorizedException('缺少认证令牌');
      }

      // 2. 验证JWT令牌
      const payload = await this.jwtService.verifyAsync(token);

      // 3. 验证用户状态
      const user = await this.validateUser((payload as { sub: string }).sub);
      if (!user || !user.isActive()) {
        throw new UnauthorizedException('用户账户无效或已禁用');
      }

      // 4. 设置请求上下文
      request.user = this.createUserContext(user);
      request.traceId = traceId;

      this.logger.debug('JWT认证成功', {
        userId: user.getId().getValue(),
        traceId,
      });

      return true;
    } catch (error) {
      this.logger.warn('JWT认证失败', {
        traceId,
        error: error instanceof Error ? error.message : String(error),
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      });

      throw new UnauthorizedException('认证失败');
    }
  }

  /**
   * 从请求头提取令牌
   *
   * @description 从Authorization头中提取Bearer令牌
   *
   * @param request - HTTP请求
   * @returns JWT令牌或null
   */
  private extractTokenFromHeader(request: { headers: { authorization?: string } }): string | null {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');

    return type === 'Bearer' ? token : null;
  }

  /**
   * 验证用户状态
   *
   * @description 验证用户是否存在且状态正常
   *
   * @param userId - 用户ID
   * @returns 用户实体或null
   */
  private async validateUser(_userId: string): Promise<IUser | null> {
    // 这里应该调用用户服务验证用户状态
    // 实际实现中会从数据库或缓存中获取用户信息
    return null; // 占位符实现
  }

  /**
   * 创建用户上下文
   *
   * @description 创建用户上下文对象
   *
   * @param user - 用户实体
   * @returns 用户上下文
   */
  private createUserContext(user: IUser): IUserContext {
    return {
      userId: user.getId().getValue(),
      email: user.getEmail().getValue(),
      name: user.getName().getValue(),
      tenantId: user.getTenantId(),
      roles: user.getRoles().map((role: IRole) => role.getName()),
      permissions: user
        .getPermissions()
        .map((perm: IPermission) => perm.getName()),
    };
  }

  /**
   * 生成追踪ID
   *
   * @description 生成请求追踪ID
   *
   * @returns 追踪ID
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
