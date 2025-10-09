/**
 * 邮件适配器（简化版本）
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailAdapter {
  async sendVerificationEmail(email: string, code: string): Promise<void> {
    console.log(`发送验证邮件到: ${email}, 验证码: ${code}`);
    // TODO: 集成邮件服务提供商
  }

  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    console.log(`发送欢迎邮件到: ${email}`);
  }
}

