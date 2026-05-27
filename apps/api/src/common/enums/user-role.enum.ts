// Port from apg-manager/apps/api/prisma/schema.prisma
// TODO: thay role values khi viết Prisma schema OpenFly (CUSTOMER/AGENT/ADMIN — xem plan Section 3)
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  SALES = 'SALES',
  ACCOUNTANT = 'ACCOUNTANT',
}
