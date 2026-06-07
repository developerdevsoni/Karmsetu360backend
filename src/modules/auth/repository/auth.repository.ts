import { prisma } from '../../../config/database';

export class AuthRepository {
  public static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: true
          }
        },
        employeeProfile: {
          include: {
            branch: true
          }
        }
      }
    });
  }

  public static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            permissions: true
          }
        },
        employeeProfile: true
      }
    });
  }

  public static async updateRefreshTokens(userId: string, tokens: string[]) {
    return prisma.user.update({
      where: { id: userId },
      data: { refreshTokens: tokens }
    });
  }

  public static async addDeviceToken(userId: string, deviceToken: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { deviceTokens: true }
    });
    
    if (!user) return null;
    
    if (user.deviceTokens.includes(deviceToken)) {
      return user;
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        deviceTokens: {
          push: deviceToken
        }
      }
    });
  }

  public static async removeDeviceToken(userId: string, deviceToken: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { deviceTokens: true }
    });

    if (!user) return null;

    const updatedTokens = user.deviceTokens.filter(t => t !== deviceToken);
    
    return prisma.user.update({
      where: { id: userId },
      data: {
        deviceTokens: updatedTokens
      }
    });
  }
}
