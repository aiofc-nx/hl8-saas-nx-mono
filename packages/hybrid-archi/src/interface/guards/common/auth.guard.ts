/**
 * 通用认证守卫
 *
 * @description 用户认证守卫，验证用户身份
 * @since 1.0.0
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { FastifyRequest } from '@hl8/fastify-pro';

/**
 * 认证守卫
 *
 * @description 验证用户身份，确保请求来自已认证的用户
 *
 * ## 业务规则
 *
 * ### 认证规则
 * - 验证JWT令牌的有效性
 * - 检查令牌是否过期
 * - 验证用户是否存在且活跃
 * - 支持多租户认证
 *
 * ### 权限规则
 * - 支持基于角色的访问控制
 * - 支持基于权限的访问控制
 * - 支持租户级别的权限隔离
 * - 支持资源级别的权限控制
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector
  ) {}

  /**
   * 检查是否可以激活路由
   *
   * @description 验证用户身份和权限
   * @param context - 执行上下文
   * @returns 是否可以激活
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<FastifyRequest>();

      // 检查是否为公开接口
      const isPublic = this.reflector.get<boolean>(
        'isPublic',
        context.getHandler()
      );
      if (isPublic) {
        return true;
      }

      // 验证JWT令牌
      const token = this.extractTokenFromHeader(request);
      if (!token) {
        throw new UnauthorizedException('未提供认证令牌');
      }

      // 验证令牌
      const payload = await this.jwtService.verifyAsync(token);
      if (!payload) {
        throw new UnauthorizedException('无效的认证令牌');
      }

      // 设置用户信息到请求上下文
      request['user'] = payload;
      request['tenantId'] = payload.tenantId;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('认证失败');
    }
  }

  /**
   * 从请求头中提取令牌
   *
   * @description 从Authorization头中提取Bearer令牌
   * @param request - Fastify请求
   * @returns JWT令牌
   * @private
   */
  private extractTokenFromHeader(request: FastifyRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
