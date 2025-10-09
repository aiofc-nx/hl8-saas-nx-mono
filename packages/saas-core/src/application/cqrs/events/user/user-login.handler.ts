import { EventHandler, IEventHandler } from '@hl8/hybrid-archi';
import { UserLoginEvent } from '../../../../domain/user/events/user-login.event';

// @EventHandler('UserLogin') // TODO: 修复装饰器类型问题
export class UserLoginHandler implements IEventHandler<UserLoginEvent> {
  async handle(event: UserLoginEvent): Promise<void> {
    console.log('用户登录事件:', event.toJSON());
    // TODO: 记录登录日志
  }
}

