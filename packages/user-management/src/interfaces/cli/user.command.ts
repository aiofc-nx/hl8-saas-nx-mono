/**
 * 用户CLI命令
 *
 * @description 用户管理的命令行工具
 * @since 1.0.0
 */

import { Command, CommandRunner, Option } from 'nest-commander';
import { UserApplicationService } from '../../application/services/user-application.service';
import { CreateUserCommand } from '../../application/commands/create-user.command';
import { GetUserQuery } from '../../application/queries/get-user.query';
import { ListUsersQuery } from '../../application/queries/list-users.query';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { Email, Username, Password } from '@hl8/hybrid-archi';
import { UserProfile } from '../../domain/value-objects/user-profile.vo';

/**
 * 用户CLI命令
 *
 * @description 提供用户管理的命令行工具
 *
 * ## 业务规则
 *
 * ### 命令执行规则
 * - 支持用户创建
 * - 支持用户查询
 * - 支持用户列表
 * - 支持批量操作
 *
 * ### 数据验证规则
 * - 命令行参数验证
 * - 数据格式验证
 * - 权限验证
 * - 错误处理
 */
@Command({
  name: 'user',
  description: '用户管理命令行工具',
  subCommands: [],
})
export class UserCommand extends CommandRunner {
  constructor(private readonly userApplicationService: UserApplicationService) {
    super();
  }

  /**
   * 运行命令
   *
   * @description 执行用户管理命令
   * @param passedParams - 传递的参数
   * @param options - 命令选项
   */
  async run(
    passedParams: string[],
    options: Record<string, any>
  ): Promise<void> {
    const [action] = passedParams;

    switch (action) {
      case 'create':
        await this.createUser(options);
        break;
      case 'get':
        await this.getUser(options);
        break;
      case 'list':
        await this.listUsers(options);
        break;
      default:
        console.log('未知命令，请使用 --help 查看帮助');
    }
  }

  /**
   * 创建用户
   *
   * @description 通过命令行创建用户
   * @param options - 命令选项
   */
  async createUser(options: Record<string, any>): Promise<void> {
    try {
      const {
        email,
        username,
        password,
        firstName,
        lastName,
        avatar,
        phone,
        tenantId,
      } = options;

      if (!email || !username || !password || !firstName || !lastName) {
        console.error(
          '缺少必需参数: email, username, password, firstName, lastName'
        );
        return;
      }

      const command = new CreateUserCommand(
        UserId.generate(),
        Email.create(email),
        Username.create(username),
        Password.create(password),
        UserProfile.create({
          firstName,
          lastName,
          avatar,
          phone,
        }),
        tenantId
      );

      const result = await this.userApplicationService.createUser(command);

      if (result.success) {
        console.log('用户创建成功:', result.userId?.value);
      } else {
        console.error('用户创建失败:', result.error);
      }
    } catch (error) {
      console.error(
        '创建用户时发生错误:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * 获取用户
   *
   * @description 通过命令行获取用户信息
   * @param options - 命令选项
   */
  async getUser(options: Record<string, any>): Promise<void> {
    try {
      const { id } = options;

      if (!id) {
        console.error('缺少必需参数: id');
        return;
      }

      const query = new GetUserQuery(UserId.create(id));
      const result = await this.userApplicationService.getUser(query);

      if (result.success && result.user) {
        console.log('用户信息:');
        console.log('ID:', result.user.id);
        console.log('邮箱:', result.user.email);
        console.log('用户名:', result.user.username);
        console.log(
          '姓名:',
          result.user.profile?.firstName,
          result.user.profile?.lastName
        );
        console.log('状态:', result.user.status);
        console.log('租户ID:', result.user.tenantId);
        console.log('创建时间:', result.user.createdAt);
        console.log('更新时间:', result.user.updatedAt);
      } else {
        console.error('获取用户失败:', result.error);
      }
    } catch (error) {
      console.error(
        '获取用户时发生错误:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * 列出用户
   *
   * @description 通过命令行列出用户
   * @param options - 命令选项
   */
  async listUsers(options: Record<string, any>): Promise<void> {
    try {
      const { tenantId, status, page = 1, limit = 10, search } = options;

      if (!tenantId) {
        console.error('缺少必需参数: tenantId');
        return;
      }

      const query = new ListUsersQuery(tenantId, status, page, limit, search);
      const result = await this.userApplicationService.listUsers(query);

      if (result.success && result.users) {
        console.log(`用户列表 (共 ${result.total} 个用户):`);
        console.log('页码:', page, '每页:', limit);
        console.log('');

        result.users.forEach((user, index) => {
          console.log(`${index + 1}. ${user.username} (${user.email})`);
          console.log(
            `   姓名: ${user.profile?.firstName} ${user.profile?.lastName}`
          );
          console.log(`   状态: ${user.status}`);
          console.log(`   创建时间: ${user.createdAt}`);
          console.log('');
        });
      } else {
        console.error('获取用户列表失败:', result.error);
      }
    } catch (error) {
      console.error(
        '获取用户列表时发生错误:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}
