/**
 * 用户响应DTO
 *
 * @description 用户信息的响应数据传输对象，优化的数据结构
 * @since 1.0.0
 */

/**
 * 用户响应DTO
 *
 * @description 用户信息的响应数据传输对象，优化的数据结构
 */
export class UserResponseDto {
  id!: string;
  email!: string;
  username!: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
  };
  status: string;
  emailVerified: boolean;
  initials: string;
  tenantId?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  /**
   * 构造函数
   *
   * @description 创建用户响应DTO实例
   * @param data - 用户数据
   */
  constructor(data: {
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
    emailVerified: boolean;
    initials: string;
    tenantId?: string;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = data.id;
    this.email = data.email;
    this.profile = data.profile;
    this.status = data.status;
    this.emailVerified = data.emailVerified;
    this.initials = data.initials;
    this.tenantId = data.tenantId;
    this.lastLoginAt = data.lastLoginAt;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * 获取完整姓名
   *
   * @description 组合姓名和姓氏
   * @returns 完整姓名
   */
  get fullName(): string {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }

  /**
   * 检查用户是否活跃
   *
   * @description 判断用户是否处于活跃状态
   * @returns 是否活跃
   */
  get isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * 检查用户是否已验证邮箱
   *
   * @description 判断用户邮箱是否已验证
   * @returns 是否已验证邮箱
   */
  get isEmailVerified(): boolean {
    return this.emailVerified;
  }

  /**
   * 获取账户完整度
   *
   * @description 计算用户账户的完整度百分比
   * @returns 完整度百分比
   */
  get completeness(): number {
    let score = 0;

    // 邮箱验证：30分
    if (this.emailVerified) score += 30;

    // 姓名完整：20分
    if (this.profile.firstName && this.profile.lastName) score += 20;

    // 头像设置：15分
    if (this.profile.avatar) score += 15;

    // 手机号设置：15分
    if (this.profile.phone) score += 15;

    // 最近登录：20分
    if (this.lastLoginAt) score += 20;

    return Math.min(score, 100);
  }

  /**
   * 获取用户状态描述
   *
   * @description 获取用户状态的中文描述
   * @returns 状态描述
   */
  get statusDescription(): string {
    const statusMap = {
      pending: '待激活',
      active: '活跃',
      disabled: '已禁用',
      deleted: '已删除',
    };
    return statusMap[this.status as keyof typeof statusMap] || '未知状态';
  }

  /**
   * 获取最后登录时间描述
   *
   * @description 获取最后登录时间的友好描述
   * @returns 最后登录时间描述
   */
  get lastLoginDescription(): string {
    if (!this.lastLoginAt) {
      return '从未登录';
    }

    const now = new Date();
    const diff = now.getTime() - this.lastLoginAt.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return '今天';
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else if (days < 30) {
      return `${Math.floor(days / 7)}周前`;
    } else {
      return `${Math.floor(days / 30)}个月前`;
    }
  }

  /**
   * 工厂方法：从领域对象创建
   *
   * @description 从用户聚合根创建响应DTO
   * @param userAggregate - 用户聚合根
   * @returns 用户响应DTO
   */
  static fromAggregate(userAggregate: any): UserResponseDto {
    const user = userAggregate.getUser();

    return new UserResponseDto({
      id: userAggregate.getUserId().value,
      email: user.getEmail().value,
      username: user.getUsername().value,
      profile: {
        firstName: user.getProfile().getFirstName(),
        lastName: user.getProfile().getLastName(),
        avatar: user.getProfile().getAvatar(),
        phone: user.getProfile().getPhone(),
      },
      status: user.getStatus(),
      emailVerified: false, // TODO: 从用户状态获取
      initials: `${user.getProfile().getFirstName().charAt(0)}${user
        .getProfile()
        .getLastName()
        .charAt(0)}`.toUpperCase(),
      tenantId: user.getTenantId(),
      lastLoginAt: userAggregate.getLastLoginAt(),
      createdAt: userAggregate.getCreatedAt(),
      updatedAt: userAggregate.getUpdatedAt(),
    });
  }
}
