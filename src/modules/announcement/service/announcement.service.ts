import { AnnouncementRepository } from '../repository/announcement.repository';
import { AppError } from '../../../utils/response';
import { prisma } from '../../../config/database';
import { EmailService } from '../../../utils/email.service';

export class AnnouncementService {
  public static async create(orgId: string, data: any) {
    const announcement = await AnnouncementRepository.create(orgId, data);
    
    // Identify target audience email list
    const filter: any = {
      organizationId: orgId,
      status: 'ACTIVE'
    };

    if (data.branchId) {
      filter.employeeProfile = { branchId: data.branchId };
    }

    if (data.department) {
      if (filter.employeeProfile) {
        filter.employeeProfile.department = data.department;
      } else {
        filter.employeeProfile = { department: data.department };
      }
    }

    const users = await prisma.user.findMany({
      where: filter,
      select: { email: true }
    });

    // Send emails in background
    users.forEach((u) => {
      EmailService.queueEmail(u.email, `Announcement: ${announcement.title}`, 'ANNOUNCEMENT', {
        title: announcement.title,
        content: announcement.content
      });
    });

    return announcement;
  }

  public static async update(id: string, orgId: string, data: any) {
    const announcement = await AnnouncementRepository.findById(id, orgId);
    if (!announcement) {
      throw new AppError('Announcement not found.', 404);
    }
    return AnnouncementRepository.update(id, orgId, data);
  }

  public static async delete(id: string, orgId: string) {
    const announcement = await AnnouncementRepository.findById(id, orgId);
    if (!announcement) {
      throw new AppError('Announcement not found.', 404);
    }
    return AnnouncementRepository.delete(id, orgId);
  }

  public static async get(id: string, orgId: string) {
    const announcement = await AnnouncementRepository.findById(id, orgId);
    if (!announcement) {
      throw new AppError('Announcement not found.', 404);
    }
    return announcement;
  }

  public static async listAdmin(orgId: string) {
    return AnnouncementRepository.findAllAdmin(orgId);
  }

  public static async listEmployee(userId: string, orgId: string) {
    const emp = await prisma.employee.findFirst({
      where: { userId, organizationId: orgId }
    });
    
    if (!emp) {
      throw new AppError('Employee profile associated with user not found.', 404);
    }
    
    return AnnouncementRepository.findAllForEmployee(orgId, emp.branchId, emp.department);
  }
}
