import { Request, Response, NextFunction } from 'express';
import { BranchService } from '../service/branch.service';
import { sendResponse } from '../../../utils/response';

export class BranchController {
  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const { name, address } = req.body;
      const result = await BranchService.createBranch(orgId!, name, address);
      return sendResponse(res, 201, true, 'Branch created successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const id = req.params.id as string;
      const result = await BranchService.updateBranch(id, orgId!, req.body);
      return sendResponse(res, 200, true, 'Branch updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const id = req.params.id as string;
      await BranchService.deleteBranch(id, orgId!);
      return sendResponse(res, 200, true, 'Branch deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const id = req.params.id as string;
      const result = await BranchService.getBranch(id, orgId!);
      return sendResponse(res, 200, true, 'Branch retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const result = await BranchService.listBranches(orgId!);
      return sendResponse(res, 200, true, 'All branches listed successfully', result);
    } catch (error) {
      next(error);
    }
  }
}
