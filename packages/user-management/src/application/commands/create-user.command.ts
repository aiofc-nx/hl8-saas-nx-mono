/**
 * 创建用户命令
 *
 * @description 创建新用户的命令对象
 * @since 1.0.0
 */

import { UserId } from '../../domain/value-objects/user-id.vo';
import { Email, Username, Password } from '@hl8/hybrid-archi';
import { UserProfile } from '../../domain/value-objects/user-profile.vo';
import { UserStatus } from '@hl8/hybrid-archi';

/**
 * 创建用户命令
 *
 * @description 用于创建新用户的命令对象
 */
export class CreateUserCommand {
  constructor(
    public readonly userId: UserId,
    public readonly email: Email,
    public readonly username: Username,
    public readonly password: Password,
    public readonly profile: UserProfile,
    public readonly tenantId?: string
  ) {}
}

/**
 * 创建用户命令结果
 *
 * @description 创建用户命令的执行结果
 */
export class CreateUserResult {
  constructor(
    public readonly success: boolean,
    public readonly userId?: UserId,
    public readonly error?: string
  ) {}
}
