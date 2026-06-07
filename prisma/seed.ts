import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, RoleType, PermissionType, EmployeeStatus } from "../src/generated/prisma/client";
import bcrypt from 'bcrypt';

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding system permissions...');
  
  // Clean tables to start fresh
  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "users", "roles", "permissions", "organizations", "branches" CASCADE;`);
  } catch (err) {
    console.log('Clean step skipped or not needed (first run)');
  }
  
  // Define Resources
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

  // Insert permissions
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

  // Create Roles
  console.log('Creating global roles...');
  
  // 1. Super Admin Role
  const superAdminRole = await prisma.role.create({
    data: {
      name: 'Super Admin',
      roleType: RoleType.SUPER_ADMIN,
      permissions: {
        connect: seededPermissions.map(p => ({ id: p.id }))
      }
    }
  });

  // 2. Org Admin Role
  const orgAdminRole = await prisma.role.create({
    data: {
      name: 'Organization Admin',
      roleType: RoleType.ORG_ADMIN,
      permissions: {
        connect: seededPermissions.map(p => ({ id: p.id }))
      }
    }
  });

  // 3. HR Role (Exclude audit trails and settings changes)
  const hrPermissions = seededPermissions.filter(p => 
    p.resource !== 'AUDIT' && 
    !(p.resource === 'SETTINGS' && (p.action === PermissionType.DELETE || p.action === PermissionType.UPDATE))
  );
  const hrRole = await prisma.role.create({
    data: {
      name: 'HR',
      roleType: RoleType.HR,
      permissions: {
        connect: hrPermissions.map(p => ({ id: p.id }))
      }
    }
  });

  // 4. Branch Manager Role (Manage details without destructive deletions)
  const managerPermissions = seededPermissions.filter(p =>
    ['EMPLOYEE', 'ATTENDANCE', 'LEAVE', 'SHIFT', 'HOLIDAY', 'ANNOUNCEMENT', 'REPORT'].includes(p.resource) &&
    p.action !== PermissionType.DELETE
  );
  const managerRole = await prisma.role.create({
    data: {
      name: 'Branch Manager',
      roleType: RoleType.BRANCH_MANAGER,
      permissions: {
        connect: managerPermissions.map(p => ({ id: p.id }))
      }
    }
  });

  // 5. Employee Role (Create check-in, leave requests, read basic calendars)
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
      permissions: {
        connect: employeePermissions.map(p => ({ id: p.id }))
      }
    }
  });

  console.log('Roles created successfully.');

  // Create Super Admin User
  const email = process.env.SUPERADMIN_EMAIL || 'superadmin@karmsetu.com';
  const password = process.env.SUPERADMIN_PASSWORD || 'SuperSecureAdmin123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log(`Creating default Super Admin user (${email})...`);
  await prisma.user.create({
    data: {
      name: 'System Super Admin',
      email,
      passwordHash: hashedPassword,
      status: EmployeeStatus.ACTIVE,
      roleId: superAdminRole.id
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
