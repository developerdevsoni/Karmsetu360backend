import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { 
  PrismaClient, 
  RoleType, 
  PermissionType, 
  EmployeeStatus, 
  LeaveType, 
  LeaveStatus, 
  AttendanceStatus, 
  PayrollStatus, 
  TaskStatus 
} from "../src/generated/prisma/client";
import bcrypt from 'bcrypt';

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing database tables...');
  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "users", "roles", "permissions", "organizations", "branches", "employees", "shifts", "attendance", "leaves", "leave_balances", "payrolls", "tasks", "audit_logs", "org_settings" CASCADE;`);
  } catch (err) {
    console.log('Clean step skipped or not needed (first run)', err);
  }

  console.log('Seeding system permissions...');
  
  const resources = [
    'EMPLOYEE',
    'ATTENDANCE',
    'LEAVE',
    'SHIFT',
    'PAYROLL',
    'HOLIDAY',
    'ANNOUNCEMENT',
    'REPORT',
    'SETTINGS',
    'AUDIT'
  ];

  const actions = [
    PermissionType.CREATE,
    PermissionType.READ,
    PermissionType.UPDATE,
    PermissionType.DELETE,
    PermissionType.APPROVE
  ];

  const permissionsList = [];
  for (const resource of resources) {
    for (const action of actions) {
      permissionsList.push({
        action,
        resource
      });
    }
  }

  const seededPermissions = [];
  for (const perm of permissionsList) {
    const dbPerm = await prisma.permission.upsert({
      where: { action_resource: { action: perm.action, resource: perm.resource } },
      update: {},
      create: perm
    });
    seededPermissions.push(dbPerm);
  }
  console.log(`Seeded ${seededPermissions.length} permissions.`);

  // Create Global Roles
  console.log('Creating global roles...');
  const superAdminRole = await prisma.role.create({
    data: {
      name: 'Super Admin',
      roleType: RoleType.SUPER_ADMIN,
      permissions: { connect: seededPermissions.map(p => ({ id: p.id })) }
    }
  });

  const orgAdminRole = await prisma.role.create({
    data: {
      name: 'Organization Admin',
      roleType: RoleType.ORG_ADMIN,
      permissions: { connect: seededPermissions.map(p => ({ id: p.id })) }
    }
  });

  const hrPermissions = seededPermissions.filter(p => 
    p.resource !== 'AUDIT' && 
    !(p.resource === 'SETTINGS' && (p.action === PermissionType.DELETE || p.action === PermissionType.UPDATE))
  );
  const hrRole = await prisma.role.create({
    data: {
      name: 'HR',
      roleType: RoleType.HR,
      permissions: { connect: hrPermissions.map(p => ({ id: p.id })) }
    }
  });

  const managerPermissions = seededPermissions.filter(p =>
    ['EMPLOYEE', 'ATTENDANCE', 'LEAVE', 'SHIFT', 'HOLIDAY', 'ANNOUNCEMENT', 'REPORT'].includes(p.resource) &&
    p.action !== PermissionType.DELETE
  );
  const managerRole = await prisma.role.create({
    data: {
      name: 'Branch Manager',
      roleType: RoleType.BRANCH_MANAGER,
      permissions: { connect: managerPermissions.map(p => ({ id: p.id })) }
    }
  });

  const employeePermissions = seededPermissions.filter(p =>
    (p.resource === 'ATTENDANCE' && [PermissionType.READ, PermissionType.CREATE].includes(p.action)) ||
    (p.resource === 'LEAVE' && [PermissionType.READ, PermissionType.CREATE].includes(p.action)) ||
    (p.resource === 'EMPLOYEE' && p.action === PermissionType.READ) ||
    (p.resource === 'HOLIDAY' && p.action === PermissionType.READ) ||
    (p.resource === 'ANNOUNCEMENT' && p.action === PermissionType.READ) ||
    (p.resource === 'PAYROLL' && p.action === PermissionType.READ)
  );
  const employeeRole = await prisma.role.create({
    data: {
      name: 'Employee',
      roleType: RoleType.EMPLOYEE,
      permissions: { connect: employeePermissions.map(p => ({ id: p.id })) }
    }
  });

  console.log('Roles created successfully.');

  // Password hashing
  const superPasswordHash = await bcrypt.hash('super123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const employeePasswordHash = await bcrypt.hash('1234', 10);

  // 1. Create Super Admin User
  console.log('Creating Default Super Admin user...');
  const superAdminUser = await prisma.user.create({
    data: {
      name: 'System Super Admin',
      email: 'superadmin@karmsetu.com',
      passwordHash: superPasswordHash,
      status: EmployeeStatus.ACTIVE,
      roleId: superAdminRole.id
    }
  });

  // 2. Create Organization 1: Karmsetu Academy
  console.log('Creating Organization: Karmsetu Academy...');
  const org1 = await prisma.organization.create({
    data: {
      name: 'Karmsetu Academy',
      subscriptionTier: 'FREE',
      subscriptionStatus: 'ACTIVE',
      settings: {
        create: {
          graceTimeMinutes: 15,
          latePenaltyLimit: 3,
          latePenaltyDeduction: 0.5,
          workingDaysPerMonth: 26
        }
      }
    }
  });

  const branch1a = await prisma.branch.create({
    data: {
      organizationId: org1.id,
      name: 'Main Campus',
      address: '101 Education Lane, City North'
    }
  });

  const branch1b = await prisma.branch.create({
    data: {
      organizationId: org1.id,
      name: 'East Campus',
      address: '202 Learning Blvd, City East'
    }
  });

  // Create Shift for Org 1
  const generalShift1 = await prisma.shift.create({
    data: {
      organizationId: org1.id,
      name: 'General Day Shift',
      startTime: '09:00',
      endTime: '18:00',
      graceTime: 15,
      breakDuration: 60,
      workingHours: 8.0
    }
  });

  // Create Org 1 Admin User and profile
  console.log('Seeding Org Admin for Karmsetu Academy (admin.academy@karmsetu.com)...');
  const org1AdminUser = await prisma.user.create({
    data: {
      organizationId: org1.id,
      name: 'Academy Principal Admin',
      email: 'admin.academy@karmsetu.com',
      passwordHash: adminPasswordHash,
      status: EmployeeStatus.ACTIVE,
      roleId: orgAdminRole.id
    }
  });

  const org1AdminProfile = await prisma.employee.create({
    data: {
      userId: org1AdminUser.id,
      organizationId: org1.id,
      branchId: branch1a.id,
      employeeId: 'KACAD-ADMIN-01',
      mobile: '9876543210',
      address: 'Admin Residence, Campus Quarter',
      department: 'Administration',
      designation: 'Principal Director',
      joiningDate: new Date('2024-01-01'),
      baseSalary: 120000.0,
      shiftId: generalShift1.id
    }
  });

  // Create Org 1 HR User and profile
  console.log('Seeding HR for Karmsetu Academy...');
  const org1HRUser = await prisma.user.create({
    data: {
      organizationId: org1.id,
      name: 'Academy HR Officer',
      email: 'hr.academy@karmsetu.com',
      passwordHash: employeePasswordHash,
      status: EmployeeStatus.ACTIVE,
      roleId: hrRole.id
    }
  });

  const org1HRProfile = await prisma.employee.create({
    data: {
      userId: org1HRUser.id,
      organizationId: org1.id,
      branchId: branch1a.id,
      employeeId: 'KACAD-HR-01',
      mobile: '9876543211',
      address: 'Staff Quarter A1',
      department: 'Human Resources',
      designation: 'HR Manager',
      joiningDate: new Date('2024-06-01'),
      baseSalary: 60000.0,
      shiftId: generalShift1.id
    }
  });

  // Create Org 1 Regular Employee and profile
  console.log('Seeding Regular Employees for Karmsetu Academy...');
  const org1EmpUser1 = await prisma.user.create({
    data: {
      organizationId: org1.id,
      name: 'Rohan Sharma',
      email: 'emp.academy@karmsetu.com',
      passwordHash: employeePasswordHash,
      status: EmployeeStatus.ACTIVE,
      roleId: employeeRole.id
    }
  });

  const org1EmpProfile1 = await prisma.employee.create({
    data: {
      userId: org1EmpUser1.id,
      organizationId: org1.id,
      branchId: branch1a.id,
      employeeId: 'KACAD-EMP-101',
      mobile: '9876543212',
      address: '12 Green Avenue, Flat 4B',
      department: 'Academics',
      designation: 'Senior Teacher',
      joiningDate: new Date('2025-01-15'),
      baseSalary: 40000.0,
      shiftId: generalShift1.id
    }
  });

  const org1EmpUser2 = await prisma.user.create({
    data: {
      organizationId: org1.id,
      name: 'Priya Patel',
      email: 'emp2.academy@karmsetu.com',
      passwordHash: employeePasswordHash,
      status: EmployeeStatus.ACTIVE,
      roleId: employeeRole.id
    }
  });

  const org1EmpProfile2 = await prisma.employee.create({
    data: {
      userId: org1EmpUser2.id,
      organizationId: org1.id,
      branchId: branch1b.id,
      employeeId: 'KACAD-EMP-102',
      mobile: '9876543213',
      address: '56 Lake View Road',
      department: 'Academics',
      designation: 'Junior Lecturer',
      joiningDate: new Date('2025-03-01'),
      baseSalary: 35000.0,
      shiftId: generalShift1.id
    }
  });


  // 3. Create Organization 2: Soni Coaching Center
  console.log('Creating Organization: Soni Coaching Center...');
  const org2 = await prisma.organization.create({
    data: {
      name: 'Soni Coaching Center',
      subscriptionTier: 'PREMIUM',
      subscriptionStatus: 'ACTIVE',
      settings: {
        create: {
          graceTimeMinutes: 10,
          latePenaltyLimit: 3,
          latePenaltyDeduction: 0.5,
          workingDaysPerMonth: 26
        }
      }
    }
  });

  const branch2 = await prisma.branch.create({
    data: {
      organizationId: org2.id,
      name: 'City Center Branch',
      address: '4th Floor, Platinum Plaza'
    }
  });

  const generalShift2 = await prisma.shift.create({
    data: {
      organizationId: org2.id,
      name: 'Afternoon Shift',
      startTime: '13:00',
      endTime: '21:00',
      graceTime: 10,
      breakDuration: 45,
      workingHours: 7.25
    }
  });

  // Create Org 2 Admin User and profile
  console.log('Seeding Org Admin for Soni Coaching...');
  const org2AdminUser = await prisma.user.create({
    data: {
      organizationId: org2.id,
      name: 'Soni Coaching Administrator',
      email: 'admin.soni@karmsetu.com',
      passwordHash: adminPasswordHash,
      status: EmployeeStatus.ACTIVE,
      roleId: orgAdminRole.id
    }
  });

  const org2AdminProfile = await prisma.employee.create({
    data: {
      userId: org2AdminUser.id,
      organizationId: org2.id,
      branchId: branch2.id,
      employeeId: 'SONI-ADMIN-01',
      mobile: '9123456780',
      address: 'Suite 203, Sky Tower',
      department: 'Management',
      designation: 'Owner & Director',
      joiningDate: new Date('2023-05-01'),
      baseSalary: 150000.0,
      shiftId: generalShift2.id
    }
  });

  // Create Org 2 Regular Employee
  console.log('Seeding Regular Employee for Soni Coaching...');
  const org2EmpUser = await prisma.user.create({
    data: {
      organizationId: org2.id,
      name: 'Amit Verma',
      email: 'emp.soni@karmsetu.com',
      passwordHash: employeePasswordHash,
      status: EmployeeStatus.ACTIVE,
      roleId: employeeRole.id
    }
  });

  const org2EmpProfile = await prisma.employee.create({
    data: {
      userId: org2EmpUser.id,
      organizationId: org2.id,
      branchId: branch2.id,
      employeeId: 'SONI-EMP-201',
      mobile: '9123456781',
      address: '77 Heritage Colony',
      department: 'Faculty',
      designation: 'Physics Tutor',
      joiningDate: new Date('2024-09-01'),
      baseSalary: 45000.0,
      shiftId: generalShift2.id
    }
  });

  // 4. Seeding Leave Balances
  console.log('Seeding leave balances for employees...');
  const employees = [
    { empId: org1EmpProfile1.id, orgId: org1.id },
    { empId: org1EmpProfile2.id, orgId: org1.id },
    { empId: org2EmpProfile.id, orgId: org2.id }
  ];

  for (const emp of employees) {
    await prisma.leaveBalance.createMany({
      data: [
        { organizationId: emp.orgId, employeeId: emp.empId, leaveType: LeaveType.ANNUAL, balance: 12.0 },
        { organizationId: emp.orgId, employeeId: emp.empId, leaveType: LeaveType.CASUAL, balance: 8.0 },
        { organizationId: emp.orgId, employeeId: emp.empId, leaveType: LeaveType.SICK, balance: 6.0 }
      ]
    });
  }

  // 5. Seeding Attendance Logs (Past 3 Days for Rohan Sharma)
  console.log('Seeding historical attendance logs...');
  const today = new Date();
  
  const attendanceData = [
    {
      date: new Date(new Date().setDate(today.getDate() - 2)), // 2 days ago
      checkIn: new Date(new Date(new Date().setDate(today.getDate() - 2)).setHours(9, 5, 0)), // 9:05 AM
      checkOut: new Date(new Date(new Date().setDate(today.getDate() - 2)).setHours(18, 0, 0)), // 6:00 PM
      status: AttendanceStatus.PRESENT,
      workingHours: 8.92
    },
    {
      date: new Date(new Date().setDate(today.getDate() - 1)), // Yesterday
      checkIn: new Date(new Date(new Date().setDate(today.getDate() - 1)).setHours(9, 45, 0)), // 9:45 AM (Late)
      checkOut: new Date(new Date(new Date().setDate(today.getDate() - 1)).setHours(18, 0, 0)), // 6:00 PM
      status: AttendanceStatus.LATE,
      workingHours: 8.25
    },
    {
      date: today, // Today
      checkIn: new Date(new Date().setHours(8, 55, 0)), // 8:55 AM (Early)
      checkOut: null, // Still checked in
      status: AttendanceStatus.PRESENT,
      workingHours: 0.0
    }
  ];

  for (const att of attendanceData) {
    await prisma.attendance.create({
      data: {
        organizationId: org1.id,
        branchId: branch1a.id,
        employeeId: org1EmpProfile1.id,
        date: att.date,
        status: att.status,
        checkIn: att.checkIn,
        checkOut: att.checkOut,
        workingHours: att.workingHours,
        notes: att.status === AttendanceStatus.LATE ? 'Heavy traffic jam on main highway.' : 'Standard punch.'
      }
    });
  }

  // 6. Seeding Leave Requests
  console.log('Seeding leave requests...');
  // Approved leave (5 days ago, duration 1 day)
  const approvedStartDate = new Date(new Date().setDate(today.getDate() - 5));
  await prisma.leave.create({
    data: {
      organizationId: org1.id,
      branchId: branch1a.id,
      employeeId: org1EmpProfile1.id,
      leaveType: LeaveType.CASUAL,
      status: LeaveStatus.APPROVED,
      startDate: approvedStartDate,
      endDate: approvedStartDate,
      reason: 'Attending cousin sister\'s wedding ceremony.',
      approvedBy: org1AdminUser.id,
      comments: 'Approved. Arrange back-up lecture slots.'
    }
  });

  // Pending leave (In 3 days, duration 2 days)
  const pendingStartDate = new Date(new Date().setDate(today.getDate() + 3));
  const pendingEndDate = new Date(new Date().setDate(today.getDate() + 4));
  await prisma.leave.create({
    data: {
      organizationId: org1.id,
      branchId: branch1a.id,
      employeeId: org1EmpProfile1.id,
      leaveType: LeaveType.SICK,
      status: LeaveStatus.PENDING,
      startDate: pendingStartDate,
      endDate: pendingEndDate,
      reason: 'Scheduled wisdom tooth removal surgery.'
    }
  });

  // 7. Seeding Payroll (Previous Month: 2026-05)
  console.log('Seeding payroll entries...');
  await prisma.payroll.create({
    data: {
      organizationId: org1.id,
      branchId: branch1a.id,
      employeeId: org1EmpProfile1.id,
      month: '2026-05',
      baseSalary: 40000.0,
      overtimePay: 1500.0,
      bonus: 3000.0,
      leaveDeductions: 0.0,
      latePenalties: 500.0,
      netSalary: 44000.0,
      status: PayrollStatus.PAID,
      payslipUrl: 'https://karmsetu-storage.s3.amazonaws.com/payslips/2026-05-KACAD-EMP-101.pdf'
    }
  });

  // 8. Seeding Tasks
  console.log('Seeding employee tasks...');
  await prisma.task.create({
    data: {
      organizationId: org1.id,
      employeeId: org1EmpProfile1.id,
      creatorId: org1AdminUser.id,
      title: 'Prepare Class 10 Math Revision Slides',
      description: 'Create slide deck for chapter 3 & 4 covering board question papers of past 5 years.',
      status: TaskStatus.IN_PROGRESS,
      dueDate: new Date(new Date().setDate(today.getDate() + 2))
    }
  });

  await prisma.task.create({
    data: {
      organizationId: org1.id,
      employeeId: org1EmpProfile1.id,
      creatorId: org1AdminUser.id,
      title: 'Submit Monthly Class Attendance Summary',
      description: 'Upload consolidated attendance sheets for section A, B, and C lecturers.',
      status: TaskStatus.PENDING,
      dueDate: new Date(new Date().setDate(today.getDate() + 4))
    }
  });

  await prisma.task.create({
    data: {
      organizationId: org2.id,
      employeeId: org2EmpProfile.id,
      creatorId: org2AdminUser.id,
      title: 'Conduct Sunday Physics Board Mock Test',
      description: 'Print test papers and coordinate hall arrangement with management staffs.',
      status: TaskStatus.PENDING,
      dueDate: new Date(new Date().setDate(today.getDate() + 3))
    }
  });

  console.log('Dummy database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
