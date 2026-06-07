import { NotificationRepository } from '../repository/notification.repository';

export class NotificationService {
  public static async getNotifications(userId: string) {
    return NotificationRepository.findUserNotifications(userId);
  }

  public static async markRead(id: string, userId: string) {
    return NotificationRepository.markAsRead(id, userId);
  }

  public static async markAllRead(userId: string) {
    return NotificationRepository.markAllAsRead(userId);
  }

  public static async deleteNotification(id: string, userId: string) {
    return NotificationRepository.delete(id, userId);
  }
}
