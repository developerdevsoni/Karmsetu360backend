import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from '../service/organization.service';
import { sendResponse } from '../../../utils/response';

export class OrganizationController {
  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, logoUrl } = req.body;
      const result = await OrganizationService.createOrganization(name, logoUrl);
      return sendResponse(res, 201, true, 'Organization registered successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = (req.params.id || req.tenant?.organizationId) as string;
      const result = await OrganizationService.updateOrganization(id, req.body);
      return sendResponse(res, 200, true, 'Organization profile updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const id = (req.params.id || req.tenant?.organizationId) as string;
      const result = await OrganizationService.getOrganization(id);
      return sendResponse(res, 200, true, 'Organization details retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OrganizationService.listOrganizations();
      return sendResponse(res, 200, true, 'All organizations listed successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const result = await OrganizationService.getSettings(orgId!);
      return sendResponse(res, 200, true, 'Organization configurations retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  public static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const result = await OrganizationService.updateSettings(orgId!, req.body);
      return sendResponse(res, 200, true, 'Organization configurations updated successfully', result);
    } catch (error) {
      next(error);
    }
  }
}
