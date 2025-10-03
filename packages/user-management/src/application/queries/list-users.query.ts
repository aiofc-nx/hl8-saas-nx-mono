/**
 * 列出用户查询
 *
 * @description 列出用户的查询对象
 * @since 1.0.0
 */

/**
 * 列出用户查询
 *
 * @description 用于列出用户的查询对象
 */
export class ListUsersQuery {
  constructor(
    public readonly tenantId?: string,
    public readonly status?: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly search?: string
  ) {}
}

/**
 * 列出用户查询结果
 *
 * @description 列出用户查询的执行结果
 */
export class ListUsersResult {
  constructor(
    public readonly success: boolean,
    public readonly users: UserInfo[] = [],
    public readonly total: number = 0,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly error?: string
  ) {}
}

/**
 * 用户信息
 *
 * @description 用户的基本信息
 */
export interface UserInfo {
  id: string;
  email: string;
  username: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
  };
  status: string;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}
