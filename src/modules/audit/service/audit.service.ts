import { prisma } from '../../../config/database';
import { logger } from '../../../config/logger';

export class AuditService {
  public static async log(
    organizationId: string | null,
    userId: string,
    action: string,
    entity: string,
    entityId: string | null,
    oldValue: any = null,
    newValue: any = null,
    req?: any
  ) {
    try {
      // Safely extract client networking details
      const ipAddress = req ? (req.ip || req.headers['x-forwarded-for'] || null) : null;
      const userAgent = req ? (req.headers['user-agent'] || null) : null;

      await prisma.auditLog.create({
        data: {
          organizationId,
          userId,
          action,
          entity,
          entityId,
          oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
          newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
          ipAddress,
          userAgent
        }
      });

      logger.info(`[AUDIT] Action: ${action} | Entity: ${entity} | Actor: ${userId}`);
    } catch (error) {
      logger.error('Database write failed for audit logger: ' + error);
    }
  }

  public static async fetchLogs(organizationId: string, filters: any) {
    const where: any = { organizationId };
    
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entity) where.entity = filters.entity;

    return prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { timestamp: 'desc' }
    });
  }
}
