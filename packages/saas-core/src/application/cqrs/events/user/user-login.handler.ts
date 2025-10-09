import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserLoginEvent } from '../../../../domain/user/events/user-login.event';

@EventsHandler(UserLoginEvent)
export class UserLoginHandler implements IEventHandler<UserLoginEvent> {
  async handle(event: UserLoginEvent): Promise<void> {
    console.log('用户登录事件:', event.toJSON());
    // TODO: 记录登录日志
  }
}

