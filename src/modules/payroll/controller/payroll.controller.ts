import { Request, Response, NextFunction } from 'express';
import { PayrollService } from '../service/payroll.service';
import { sendResponse } from '../../../utils/response';
import path from 'path';
import fs from 'fs';

export class PayrollController {
  public static async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const { month, branchId } = req.body;
      const result = await PayrollService.generatePayroll(orgId!, month, branchId);
      return sendResponse(res, 200, true, 'Payroll sheets successfully compiled.', result);
    } catch (error) {
      next(error);
    }
  }

  public static async updateRow(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const id = req.params.id as string;
      const result = await PayrollService.updatePayrollRow(id, orgId!, req.body);
      return sendResponse(res, 200, true, 'Payroll sheet row revised successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  public static async lock(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const { month } = req.body;
      const result = await PayrollService.lockPayroll(orgId!, month);
      return sendResponse(res, 200, true, 'Payroll sheets locked and payslip files generated.', result);
    } catch (error) {
      next(error);
    }
  }

  public static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const id = req.params.id as string;
      const result = await PayrollService.getPayslip(id, orgId!);
      return sendResponse(res, 200, true, 'Payroll details retrieved successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const result = await PayrollService.listPayrolls(orgId!, req.query);
      return sendResponse(res, 200, true, 'All payroll sheets retrieved.', result);
    } catch (error) {
      next(error);
    }
  }

  public static async listSelfPayslips(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user?.organizationId;
      const userId = req.user?.userId;
      const result = await PayrollService.getPayslipsForEmployee(userId!, orgId!);
      return sendResponse(res, 200, true, 'Self payslip logs retrieved.', result);
    } catch (error) {
      next(error);
    }
  }

  public static async downloadPayslip(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.user?.organizationId; // Enforces tenant match
      const id = req.params.id as string;
      const payroll = await PayrollService.getPayslip(id, orgId!);
      
      if (!payroll.payslipUrl) {
        return res.status(404).json({ success: false, message: 'Salary slip PDF has not been built yet.' });
      }

      const filePath = path.join(process.cwd(), payroll.payslipUrl);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'Salary slip PDF file could not be located on disk.' });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=payslip-${payroll.month}-${payroll.id}.pdf`);
      return res.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  }
}
