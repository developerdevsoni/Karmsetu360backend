import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from '../service/employee.service';
import { sendResponse } from '../../../utils/response';

export class EmployeeController {
  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const result = await EmployeeService.createEmployee(orgId!, req.body);
      return sendResponse(res, 201, true, 'Employee profile created successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const id = req.params.id as string;
      const result = await EmployeeService.updateEmployee(id, orgId!, req.body);
      return sendResponse(res, 200, true, 'Employee profile updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const id = req.params.id as string;
      const result = await EmployeeService.getEmployee(id, orgId!);
      return sendResponse(res, 200, true, 'Employee profile retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user?.organizationId;
      const userId = req.user?.userId;
      const result = await EmployeeService.getSelfProfile(userId!, orgId!);
      return sendResponse(res, 200, true, 'Self profile retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const { branchId, department, designation, shiftId, status, search } = req.query;
      
      const filters = {
        branchId: branchId as string,
        department: department as string,
        designation: designation as string,
        shiftId: shiftId as string,
        status: status as string,
        search: search as string
      };

      const result = await EmployeeService.listEmployees(orgId!, filters);
      return sendResponse(res, 200, true, 'Employee list retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const id = req.params.id as string;
      await EmployeeService.deleteEmployee(id, orgId!);
      return sendResponse(res, 200, true, 'Employee profile deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const id = req.params.id as string;
      await EmployeeService.deactivateEmployee(id, orgId!);
      return sendResponse(res, 200, true, 'Employee deactivated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async importEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please upload a valid Excel or CSV spreadsheet file.' });
      }
      const result = await EmployeeService.bulkImport(orgId!, req.file.buffer);
      return sendResponse(res, 200, true, 'Excel upload and parsing operations completed.', result);
    } catch (error) {
      next(error);
    }
  }

  public static async exportEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const format = (req.query.format as string) === 'csv' ? 'csv' : 'excel';
      const result = await EmployeeService.bulkExport(orgId!, format);
      
      const ext = format === 'csv' ? 'csv' : 'xlsx';
      const filename = `employee_export_${Date.now()}.${ext}`;
      
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      return res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  }
}
