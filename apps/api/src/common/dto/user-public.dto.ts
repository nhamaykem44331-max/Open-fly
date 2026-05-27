import { MembershipTier, User, UserRole } from '@prisma/client';

export class UserPublicDto {
  id!: string;
  phone!: string | null;
  email!: string | null;
  googleEmail!: string | null;
  fullName!: string | null;
  role!: UserRole;
  tier!: MembershipTier;
  milesBalance!: number;
  avatarUrl!: string | null;
  language!: string;
  active!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static fromPrisma(user: User): UserPublicDto {
    return Object.assign(new UserPublicDto(), {
      id: user.id,
      phone: user.phone,
      email: user.email,
      googleEmail: user.googleEmail,
      fullName: user.fullName,
      role: user.role,
      tier: user.tier,
      milesBalance: user.milesBalance,
      avatarUrl: user.avatarUrl,
      language: user.language,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
