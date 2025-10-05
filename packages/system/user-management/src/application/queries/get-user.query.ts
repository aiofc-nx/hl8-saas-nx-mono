/**
 * 获取用户查询
 *
 * @description 获取用户信息的查询对象
 * @since 1.0.0
 */

import { UserId } from '../../domain/value-objects/user-id.vo';

/**
 * 获取用户查询
 *
 * @description 用于获取用户信息的查询对象
 */
export class GetUserQuery {
  constructor(public readonly userId: UserId) {}
}

/**
 * 获取用户查询结果
 *
 * @description 获取用户查询的执行结果
 */
export class GetUserResult {
  constructor(
    public readonly success: boolean,
    public readonly user?: UserInfo,
    public readonly error?: string
  ) {}
}

import { UserInfo } from './list-users.query';
export { UserInfo };
