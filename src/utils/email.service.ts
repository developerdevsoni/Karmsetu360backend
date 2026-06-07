import { transporter, mailFrom } from '../config/mailer';
import { logger } from '../config/logger';

export const getHtmlTemplate = (templateName: string, context: any): string => {
  let contentHtml = '';

  switch (templateName) {
    case 'WELCOME':
      contentHtml = `
        <h2 style="color: #142e5c;">Welcome to the Team, ${context.name}!</h2>
        <p>We are thrilled to welcome you to our organization. Your employee profile has been created successfully.</p>
        <p><strong>Your Account details:</strong></p>
        <ul>
          <li><strong>Employee ID:</strong> ${context.employeeId}</li>
          <li><strong>Email:</strong> ${context.email}</li>
          <li><strong>Designation:</strong> ${context.designation}</li>
        </ul>
        <p>Please log in using your email address and the temporary password provided by your HR manager.</p>
      `;
      break;
    case 'PASSWORD_RESET':
      contentHtml = `
        <h2 style="color: #142e5c;">Reset Your Password</h2>
        <p>Hello ${context.name},</p>
        <p>We received a request to reset your password. Click the link below to set a new password. This link is valid for 1 hour.</p>
        <div style="margin: 20px 0;">
          <a href="${context.resetUrl}" style="background-color: #142e5c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p>If you did not request this, please ignore this email.</p>
      `;
      break;
    case 'LEAVE_APPROVED':
      contentHtml = `
        <h2 style="color: #2e7d32;">Leave Request Approved</h2>
        <p>Hello ${context.name},</p>
        <p>Your leave request has been approved.</p>
        <ul>
          <li><strong>Leave Type:</strong> ${context.leaveType}</li>
          <li><strong>Period:</strong> ${context.startDate} to ${context.endDate}</li>
          <li><strong>Approver Comments:</strong> ${context.comments || 'Approved.'}</li>
        </ul>
      `;
      break;
    case 'LEAVE_REJECTED':
      contentHtml = `
        <h2 style="color: #c62828;">Leave Request Declined</h2>
        <p>Hello ${context.name},</p>
        <p>Your leave request has been declined.</p>
        <ul>
          <li><strong>Leave Type:</strong> ${context.leaveType}</li>
          <li><strong>Period:</strong> ${context.startDate} to ${context.endDate}</li>
          <li><strong>Reason:</strong> ${context.comments || 'Declined.'}</li>
        </ul>
      `;
      break;
    case 'PAYROLL_GENERATED':
      contentHtml = `
        <h2 style="color: #142e5c;">Salary Slip Generated</h2>
        <p>Hello ${context.name},</p>
        <p>Your payslip for <strong>${context.month}</strong> has been generated and locked.</p>
        <p><strong>Net Take Home:</strong> INR ${context.netSalary.toLocaleString('en-IN')}</p>
        <p>You can download your detailed payslip from the employee mobile app or the web portal.</p>
      `;
      break;
    case 'ANNOUNCEMENT':
      contentHtml = `
        <h2 style="color: #142e5c;">New Announcement: ${context.title}</h2>
        <p>Dear All,</p>
        <div style="border-left: 4px solid #142e5c; padding-left: 15px; margin: 15px 0; font-style: italic;">
          ${context.content}
        </div>
        <p>Published on: ${new Date().toLocaleDateString()}</p>
      `;
      break;
    case 'HOLIDAY':
      contentHtml = `
        <h2 style="color: #142e5c;">Upcoming Holiday: ${context.name}</h2>
        <p>Dear Employees,</p>
        <p>Please note that <strong>${context.date}</strong> is a scheduled holiday for <strong>${context.holidayType}</strong> (${context.name}).</p>
      `;
      break;
    default:
      contentHtml = `<p>${context.message || 'No details provided.'}</p>`;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e1e4e8; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { background: #142e5c; padding: 25px; text-align: center; color: white; font-size: 20px; font-weight: bold; letter-spacing: 1px; }
          .body { padding: 30px; line-height: 1.6; color: #333333; font-size: 14px; }
          .footer { background: #f8f9fa; padding: 15px; text-align: center; color: #777777; font-size: 11px; border-top: 1px solid #e1e4e8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            KARMSETU WORKFORCE MANAGEMENT
          </div>
          <div class="body">
            ${contentHtml}
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Karmsetu SaaS. All rights reserved.<br>
            This is an automated email notification. Please do not reply.
          </div>
        </div>
      </body>
    </html>
  `;
};

export class EmailService {
  public static async queueEmail(to: string, subject: string, templateName: string, context: any) {
    try {
      const html = getHtmlTemplate(templateName, context);
      EmailService.sendMailDirect(to, subject, html).catch((err) => {
        logger.error(`Asynchronous direct email send to ${to} failed: ${err.message}`);
      });
      logger.info(`Asynchronous email send initiated for ${to} [Template: ${templateName}]`);
    } catch (error: any) {
      logger.error(`Failed to initiate direct email send to ${to}: ${error.message}`);
    }
  }

  public static async sendMailDirect(to: string, subject: string, html: string) {
    try {
      await transporter.sendMail({
        from: mailFrom,
        to,
        subject,
        html,
      });
      logger.info(`Email delivered to ${to}`);
    } catch (error) {
      logger.error(`Mailer direct send failed for ${to}: ${error}`);
      throw error;
    }
  }
}
