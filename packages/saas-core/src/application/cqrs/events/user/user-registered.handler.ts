import { EventHandler, IEventHandler } from '@hl8/hybrid-archi';
import { UserRegisteredEvent } from '../../../../domain/user/events/user-registered.event';

// @EventHandler('UserRegistered') // TODO: 修复装饰器类型问题
export class UserRegisteredHandler implements IEventHandler<UserRegisteredEvent> {
  async handle(event: UserRegisteredEvent): Promise<void> {
    console.log('用户注册事件:', event.toJSON());
    // TODO: 发送验证邮件
  }
}

