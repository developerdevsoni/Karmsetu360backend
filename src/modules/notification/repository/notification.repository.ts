import { prisma } from '../../../config/database';

export class NotificationRepository {
  public static async findUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  public static async markAsRead(id: string, userId: string) {
    return prisma.notification.update({
      where: { id, userId },
      data: { isRead: true }
    });
  }

  public static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }

  public static async delete(id: string, userId: string) {
    return prisma.notification.delete({
      where: { id, userId }
    });
  }
}
