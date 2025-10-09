export class UserResponseDto {
  id!: string;
  username!: string;
  email!: string;
  phoneNumber?: string;
  status!: string;
  emailVerified!: boolean;
  phoneVerified!: boolean;
  lastLoginAt?: string;
  createdAt!: string;

  static fromAggregate(aggregate: any): UserResponseDto {
    const dto = new UserResponseDto();
    const user = aggregate.getUser();
    
    dto.id = user.id.toString();
    dto.username = user.getUsername().value;
    dto.email = user.getEmail().value;
    dto.phoneNumber = user.getPhoneNumber()?.value;
    dto.status = user.getStatus();
    dto.emailVerified = user.isEmailVerified();
    dto.phoneVerified = user.isPhoneVerified();
    dto.lastLoginAt = user.getLastLoginAt()?.toISOString();
    dto.createdAt = user.createdAt.toISOString();
    
    return dto;
  }
}

