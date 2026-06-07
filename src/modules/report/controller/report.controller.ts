import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../service/report.service';
import { sendResponse } from '../../../utils/response';

export class ReportController {
  public static async attendance(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const format = (req.query.format as string) === 'csv' ? 'csv' : 'excel';
      const result = await ReportService.generateAttendanceReport(orgId!, req.query, format);
      
      const ext = format === 'csv' ? 'csv' : 'xlsx';
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${Date.now()}.${ext}`);
      return res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  }

  public static async leave(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const format = (req.query.format as string) === 'csv' ? 'csv' : 'excel';
      const result = await ReportService.generateLeaveReport(orgId!, req.query, format);
      
      const ext = format === 'csv' ? 'csv' : 'xlsx';
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename=leave_report_${Date.now()}.${ext}`);
      return res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  }

  public static async payroll(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const month = req.query.month as string;
      if (!month) {
        return res.status(400).json({ success: false, message: 'Please specify the target month query parameter in YYYY-MM format.' });
      }
      const format = (req.query.format as string) === 'csv' ? 'csv' : 'excel';
      const result = await ReportService.generatePayrollReport(orgId!, month, format);
      
      const ext = format === 'csv' ? 'csv' : 'xlsx';
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename=payroll_report_${month}_${Date.now()}.${ext}`);
      return res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  }
}
