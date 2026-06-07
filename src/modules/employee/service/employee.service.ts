import { EmployeeRepository, EmployeeFilters } from '../repository/employee.repository';
import { AppError } from '../../../utils/response';
import { prisma } from '../../../config/database';
import { EmailService } from '../../../utils/email.service';
import { parseEmployeesFromExcel, exportEmployeesToExcel, EmployeeExportRow, exportToCsvBuffer } from '../../../utils/excel.service';

export class EmployeeService {
  public static async createEmployee(orgId: string, data: any) {
    // Check if email already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });
    if (existingUser) {
      throw new AppError('Email address is already registered.', 400);
    }

    // Check if custom employeeId is duplicate inside this organization
    const existingEmp = await prisma.employee.findFirst({
      where: { organizationId: orgId, employeeId: data.employeeId }
    });
    if (existingEmp) {
      throw new AppError(`Employee ID ${data.employeeId} already exists in your organization.`, 400);
    }

    const employee = await EmployeeRepository.create(orgId, data);
    
    // Dispatch welcome email
    await EmailService.queueEmail(data.email, 'Welcome to the Team - Account Created', 'WELCOME', {
      name: data.name,
      employeeId: data.employeeId,
      email: data.email,
      designation: data.designation
    });

    return employee;
  }

  public static async updateEmployee(id: string, orgId: string, data: any) {
    const employee = await EmployeeRepository.findById(id, orgId);
    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }
    return EmployeeRepository.update(id, orgId, data);
  }

  public static async getEmployee(id: string, orgId: string) {
    const employee = await EmployeeRepository.findById(id, orgId);
    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }
    return employee;
  }

  public static async getSelfProfile(userId: string, orgId: string) {
    const employee = await EmployeeRepository.findByUserId(userId, orgId);
    if (!employee) {
      throw new AppError('Employee profile associated with user not found.', 404);
    }
    return employee;
  }

  public static async listEmployees(orgId: string, filters: EmployeeFilters) {
    return EmployeeRepository.findAll(orgId, filters);
  }

  public static async deleteEmployee(id: string, orgId: string) {
    const employee = await EmployeeRepository.findById(id, orgId);
    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }
    return EmployeeRepository.delete(id, orgId);
  }

  public static async deactivateEmployee(id: string, orgId: string) {
    const employee = await EmployeeRepository.findById(id, orgId);
    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }
    return EmployeeRepository.update(id, orgId, { status: 'INACTIVE' });
  }

  public static async bulkImport(orgId: string, fileBuffer: Buffer) {
    const parsedRows = await parseEmployeesFromExcel(fileBuffer);
    
    // Find the default "Employee" role in this organization/system
    const employeeRole = await prisma.role.findFirst({
      where: {
        roleType: 'EMPLOYEE',
        OR: [
          { organizationId: orgId },
          { organizationId: null }
        ]
      }
    });

    if (!employeeRole) {
      throw new AppError('Default Employee role not found in system. Seed roles first.', 500);
    }

    // Default branch and shift for fallback
    const defaultBranch = await prisma.branch.findFirst({ where: { organizationId: orgId } });
    if (!defaultBranch) {
      throw new AppError('No branches found. Please create at least one branch before importing employees.', 400);
    }

    const defaultShift = await prisma.shift.findFirst({ where: { organizationId: orgId } });

    const importResults = { success: 0, failed: 0, errors: [] as string[] };

    for (const row of parsedRows) {
      try {
        if (!row.email || !row.name || !row.employeeId) {
          throw new Error(`Missing mandatory columns name, email, or employeeId in row.`);
        }

        // Try mapping Branch and Shift names to IDs, or fallback
        let targetBranchId = defaultBranch.id;
        if (row.branchName) {
          const matchedBranch = await prisma.branch.findFirst({
            where: { name: { equals: row.branchName, mode: 'insensitive' }, organizationId: orgId }
          });
          if (matchedBranch) targetBranchId = matchedBranch.id;
        }

        let targetShiftId = defaultShift?.id || null;
        if (row.shiftName && orgId) {
          const matchedShift = await prisma.shift.findFirst({
            where: { name: { equals: row.shiftName, mode: 'insensitive' }, organizationId: orgId }
          });
          if (matchedShift) targetShiftId = matchedShift.id;
        }

        // Check duplicates
        const dupUser = await prisma.user.findUnique({ where: { email: row.email } });
        if (dupUser) throw new Error(`User with email ${row.email} is already registered.`);

        const dupEmp = await prisma.employee.findFirst({
          where: { organizationId: orgId, employeeId: row.employeeId }
        });
        if (dupEmp) throw new Error(`Employee ID ${row.employeeId} already exists in this tenant.`);

        // Setup mock default password: EmpPassword123!
        const defaultPassword = 'EmpPassword123!';

        await EmployeeRepository.create(orgId, {
          name: row.name,
          email: row.email,
          password: defaultPassword,
          roleId: employeeRole.id,
          branchId: targetBranchId,
          employeeId: row.employeeId,
          mobile: row.mobile || '0000000000',
          address: row.address || 'N/A',
          department: row.department || 'General',
          designation: row.designation || 'Staff',
          joiningDate: row.joiningDate || new Date(),
          shiftId: targetShiftId,
          baseSalary: row.baseSalary || 0.0
        });

        importResults.success += 1;
      } catch (err: any) {
        importResults.failed += 1;
        importResults.errors.push(`Row (ID: ${row.employeeId || 'Unknown'}): ${err.message}`);
      }
    }

    return importResults;
  }

  public static async bulkExport(orgId: string, format: 'excel' | 'csv'): Promise<{ buffer: Buffer; mimeType: string }> {
    const list = await EmployeeRepository.findAll(orgId, {});
    
    const formattedRows: EmployeeExportRow[] = list.map((emp) => ({
      employeeId: emp.employeeId,
      name: emp.user.name,
      email: emp.user.email,
      mobile: emp.mobile,
      address: emp.address,
      department: emp.department,
      designation: emp.designation,
      joiningDate: emp.joiningDate.toISOString().split('T')[0],
      branchName: emp.branch.name,
      shiftName: emp.shift?.name || 'Unassigned',
      baseSalary: emp.baseSalary,
      status: emp.user.status
    }));

    if (format === 'excel') {
      const buffer = await exportEmployeesToExcel(formattedRows);
      return {
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
    } else {
      const columns = [
        { header: 'Employee ID', key: 'employeeId' },
        { header: 'Full Name', key: 'name' },
        { header: 'Email', key: 'email' },
        { header: 'Mobile', key: 'mobile' },
        { header: 'Address', key: 'address' },
        { header: 'Department', key: 'department' },
        { header: 'Designation', key: 'designation' },
        { header: 'Joining Date', key: 'joiningDate' },
        { header: 'Branch', key: 'branchName' },
        { header: 'Shift', key: 'shiftName' },
        { header: 'Base Salary', key: 'baseSalary' },
        { header: 'Status', key: 'status' }
      ];
      const buffer = await exportToCsvBuffer(columns, formattedRows);
      return {
        buffer,
        mimeType: 'text/csv'
      };
    }
  }
}
