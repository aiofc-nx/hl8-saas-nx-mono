/**
 * 注册用户用例
 *
 * @description 处理用户注册的业务场景
 *
 * @class RegisterUserUseCase
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { EntityId, Username, Email, PhoneNumber } from '@hl8/hybrid-archi';
import { ICommandUseCase } from '../base/use-case.interface';
import { UserAggregate } from '../../../domain/user/aggregates/user.aggregate';
import { IUserAggregateRepository } from '../../../domain/user/repositories/user-aggregate.repository.interface';

export interface IRegisterUserCommand {
  username: string;
  email: string;
  phoneNumber?: string;
  password: string;
}

@Injectable()
export class RegisterUserUseCase
  implements ICommandUseCase<IRegisterUserCommand, EntityId>
{
  constructor(private readonly userRepository: IUserAggregateRepository) {}

  async execute(command: IRegisterUserCommand): Promise<EntityId> {
    const username = Username.create(command.username);
    const email = Email.create(command.email);
    const phoneNumber = command.phoneNumber
      ? PhoneNumber.create(command.phoneNumber)
      : null;

    // 验证唯一性
    if (await this.userRepository.existsByUsername(username)) {
      throw new Error(`用户名 ${command.username} 已存在`);
    }
    if (await this.userRepository.existsByEmail(email)) {
      throw new Error(`邮箱 ${command.email} 已被注册`);
    }

    // TODO: 实际需要对密码进行哈希处理
    const passwordHash = command.password; // 示例，实际使用 bcrypt
    const passwordSalt = 'salt'; // 示例

    const userId = EntityId.generate();
    const aggregate = UserAggregate.create(
      userId,
      username,
      email,
      phoneNumber,
      passwordHash,
      passwordSalt,
      { createdBy: 'system' },
    );

    await this.userRepository.save(aggregate);
    return userId;
  }
}

