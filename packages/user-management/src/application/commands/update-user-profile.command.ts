/**
 * 更新用户配置文件命令
 *
 * @description 更新用户配置文件的命令对象
 * @since 1.0.0
 */

import { UserId } from '../../domain/value-objects/user-id.vo';
import { UserProfile } from '../../domain/value-objects/user-profile.vo';

/**
 * 更新用户配置文件命令
 *
 * @description 用于更新用户配置文件的命令对象
 */
export class UpdateUserProfileCommand {
  constructor(
    public readonly userId: UserId,
    public readonly profile: UserProfile
  ) {}
}

/**
 * 更新用户配置文件命令结果
 *
 * @description 更新用户配置文件命令的执行结果
 */
export class UpdateUserProfileResult {
  constructor(
    public readonly success: boolean,
    public readonly error?: string
  ) {}
}
