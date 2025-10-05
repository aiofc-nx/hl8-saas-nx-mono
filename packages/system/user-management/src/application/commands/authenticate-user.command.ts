/**
 * 用户认证命令
 *
 * @description 用户认证的命令对象
 * @since 1.0.0
 */

import { UserId } from '../../domain/value-objects/user-id.vo';
import { Password } from '@hl8/hybrid-archi';

/**
 * 用户认证命令
 *
 * @description 用于用户认证的命令对象
 */
export class AuthenticateUserCommand {
  constructor(
    public readonly userId: UserId,
    public readonly password: Password
  ) {}
}

/**
 * 用户认证命令结果
 *
 * @description 用户认证命令的执行结果
 */
export class AuthenticateUserResult {
  constructor(
    public readonly success: boolean,
    public readonly authenticated: boolean,
    public readonly error?: string
  ) {}
}
