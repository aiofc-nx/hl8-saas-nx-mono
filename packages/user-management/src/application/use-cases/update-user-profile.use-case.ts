/**
 * 更新用户配置文件用例
 *
 * @description 更新用户配置文件的完整业务流程编排
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { UserProfile } from '../../domain/value-objects/user-profile.vo';
import { UpdateUserProfileCommand } from '../commands/update-user-profile.command';
import { UpdateUserProfileHandler } from '../commands/handlers/update-user-profile.handler';

/**
 * 更新用户配置文件用例请求
 */
export interface UpdateUserProfileRequest {
  userId: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
}

/**
 * 更新用户配置文件用例响应
 */
export interface UpdateUserProfileResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * 更新用户配置文件用例
 *
 * @description 编排更新用户配置文件的完整业务流程
 */
@Injectable()
export class UpdateUserProfileUseCase {
  constructor(
    private readonly updateUserProfileHandler: UpdateUserProfileHandler
  ) {}

  /**
   * 执行更新用户配置文件用例
   *
   * @description 编排更新用户配置文件的完整业务流程
   * @param request - 更新用户配置文件请求
   * @returns 更新结果
   */
  async execute(
    request: UpdateUserProfileRequest
  ): Promise<UpdateUserProfileResponse> {
    try {
      // 1. 应用层验证：检查输入参数
      this.validateRequest(request);

      // 2. 创建值对象
      const userId = UserId.create(request.userId);
      const profile = UserProfile.create({
        firstName: request.firstName,
        lastName: request.lastName,
        avatar: request.avatar,
        phone: request.phone,
      });

      // 3. 创建命令
      const command = new UpdateUserProfileCommand(userId, profile);

      // 4. 执行命令（通过命令处理器）
      const result = await this.updateUserProfileHandler.execute(command);

      // 5. 返回用例结果
      if (result.success) {
        return {
          success: true,
          message: '用户配置文件更新成功',
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      // 用例级错误处理
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 验证请求参数
   *
   * @description 应用层级别的参数验证
   * @param request - 更新用户配置文件请求
   * @private
   */
  private validateRequest(request: UpdateUserProfileRequest): void {
    if (!request.userId || !request.userId.trim()) {
      throw new Error('用户ID不能为空');
    }

    if (!request.firstName || !request.firstName.trim()) {
      throw new Error('姓名不能为空');
    }

    if (!request.lastName || !request.lastName.trim()) {
      throw new Error('姓氏不能为空');
    }

    // 姓名长度验证
    if (request.firstName.length > 50) {
      throw new Error('姓名长度不能超过50个字符');
    }

    if (request.lastName.length > 50) {
      throw new Error('姓氏长度不能超过50个字符');
    }

    // 手机号格式验证（如果提供）
    if (request.phone && request.phone.trim()) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(request.phone)) {
        throw new Error('手机号格式不正确');
      }
    }
  }
}
