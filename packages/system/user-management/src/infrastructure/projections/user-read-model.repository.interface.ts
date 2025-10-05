/**
 * 用户读模型仓储接口
 *
 * @description 用户读模型仓储的接口定义，支持CQRS查询端
 * @since 1.0.0
 */

/**
 * 用户读模型接口
 *
 * @description 用户读模型的数据结构
 */
export interface UserReadModel {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  status: string;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 用户读模型仓储接口
 *
 * @description 用户读模型仓储的接口定义，支持CQRS查询端
 *
 * ## 读模型功能
 *
 * ### 数据查询
 * - 支持复杂查询条件
 * - 支持分页查询
 * - 支持排序和过滤
 *
 * ### 性能优化
 * - 支持索引优化
 * - 支持缓存策略
 * - 支持查询优化
 */
export interface IUserReadModelRepository {
  /**
   * 创建用户读模型
   *
   * @description 创建用户读模型记录
   * @param userInfo - 用户信息
   * @returns 创建结果
   */
  createUser(userInfo: UserReadModel): Promise<void>;

  /**
   * 更新用户读模型
   *
   * @description 更新用户读模型记录
   * @param userId - 用户ID
   * @param userInfo - 用户信息
   * @returns 更新结果
   */
  updateUser(userId: string, userInfo: Partial<UserReadModel>): Promise<void>;

  /**
   * 删除用户读模型
   *
   * @description 删除用户读模型记录
   * @param userId - 用户ID
   * @returns 删除结果
   */
  deleteUser(userId: string): Promise<void>;

  /**
   * 根据ID查找用户
   *
   * @description 根据用户ID查找读模型
   * @param userId - 用户ID
   * @returns 用户读模型或null
   */
  findById(userId: string): Promise<UserReadModel | null>;

  /**
   * 根据邮箱查找用户
   *
   * @description 根据邮箱查找读模型
   * @param email - 用户邮箱
   * @param tenantId - 租户ID
   * @returns 用户读模型或null
   */
  findByEmail(email: string, tenantId?: string): Promise<UserReadModel | null>;

  /**
   * 根据用户名查找用户
   *
   * @description 根据用户名查找读模型
   * @param username - 用户名
   * @param tenantId - 租户ID
   * @returns 用户读模型或null
   */
  findByUsername(
    username: string,
    tenantId?: string
  ): Promise<UserReadModel | null>;

  /**
   * 根据租户查找用户列表
   *
   * @description 根据租户ID查找用户列表
   * @param tenantId - 租户ID
   * @param status - 用户状态
   * @param page - 页码
   * @param limit - 每页数量
   * @param search - 搜索关键词
   * @returns 用户列表
   */
  findByTenant(
    tenantId: string,
    status?: string,
    page?: number,
    limit?: number,
    search?: string
  ): Promise<{
    users: UserReadModel[];
    total: number;
  }>;

  /**
   * 搜索用户
   *
   * @description 根据搜索条件查找用户
   * @param query - 搜索查询
   * @param filters - 过滤条件
   * @param page - 页码
   * @param limit - 每页数量
   * @returns 搜索结果
   */
  searchUsers(
    query: string,
    filters?: Record<string, any>,
    page?: number,
    limit?: number
  ): Promise<{
    users: UserReadModel[];
    total: number;
  }>;

  /**
   * 获取用户统计信息
   *
   * @description 获取用户统计信息
   * @param tenantId - 租户ID
   * @returns 统计信息
   */
  getUserStats(tenantId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    pending: number;
  }>;
}
