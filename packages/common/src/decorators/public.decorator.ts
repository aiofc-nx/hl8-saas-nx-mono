/**
 * 公开访问装饰器
 *
 * @description 标记方法或控制器为公开访问，无需身份验证
 * 使用元数据存储公开访问标记，可通过 Reflector 读取
 *
 * ## 业务规则
 *
 * ### 公开访问规则
 * - 标记为公开的方法或控制器无需身份验证
 * - 公开方法仍然受其他守卫（如角色、权限）约束
 * - 公开标记可以在方法或控制器级别应用
 * - 方法级别的公开标记优先于控制器级别
 *
 * ## 业务逻辑流程
 *
 * 1. **装饰器应用**：将公开访问元数据附加到目标
 * 2. **守卫检查**：身份验证守卫读取元数据
 * 3. **跳过验证**：如果标记为公开，跳过身份验证
 * 4. **继续处理**：其他守卫正常执行
 *
 * @returns CustomDecorator - NestJS 自定义装饰器
 *
 * @example
 * ```typescript
 * import { Controller, Get } from '@nestjs/common';
 * import { Public } from '@hl8/common';
 *
 * @Controller('auth')
 * export class AuthController {
 *   // 公开登录接口，无需身份验证
 *   @Public()
 *   @Get('login')
 *   async login(@Body() credentials: LoginDto) {
 *     return this.authService.login(credentials);
 *   }
 *
 *   // 需要身份验证的接口
 *   @Get('profile')
 *   async getProfile(@User() user: UserEntity) {
 *     return user;
 *   }
 * }
 *
 * // 整个控制器公开
 * @Public()
 * @Controller('public')
 * export class PublicController {
 *   @Get('health')
 *   health() {
 *     return { status: 'ok' };
 *   }
 * }
 * ```
 *
 * @see {@link https://docs.nestjs.com/guards} NestJS 守卫文档
 * @see {@link https://docs.nestjs.com/fundamentals/execution-context#reflection-and-metadata} 元数据反射文档
 *
 * @since 1.0.0
 */

import { CustomDecorator, SetMetadata } from '@nestjs/common';
import { DECORATOR_METADATA } from '../constants';

/**
 * 公开访问装饰器
 *
 * @description 将方法或控制器标记为公开访问，无需身份验证
 *
 * @returns 自定义装饰器实例
 *
 * @publicApi
 */
export const Public = (): CustomDecorator =>
  SetMetadata(DECORATOR_METADATA.PUBLIC_METHOD, true);
