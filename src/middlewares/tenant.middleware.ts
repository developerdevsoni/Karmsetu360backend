import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/response';

export interface TenantContext {
  organizationId: string;
  branchId?: string;
}

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}

export const tenantContext = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Authentication context required to extract tenant.', 401));
  }

  const { role, organizationId, branchId } = req.user;

  // Super Admin can specify any tenant using headers or query parameters
  if (role === 'SUPER_ADMIN') {
    const headerOrg = (req.headers['x-organization-id'] || req.query.organizationId) as string;
    const headerBranch = (req.headers['x-branch-id'] || req.query.branchId) as string;
    
    req.tenant = {
      organizationId: headerOrg || '',
      branchId: headerBranch || undefined
    };
    return next();
  }

  // Regular tenant users must be bound to their own organization
  if (!organizationId) {
    return next(new AppError('Access Denied. No organization associated with user.', 403));
  }

  // Branch managers and employees are restricted to their branch,
  // whereas Org Admin and HR can view any branch in the organization by passing headers/query parameters.
  let activeBranchId: string | undefined = undefined;
  if (role === 'BRANCH_MANAGER' || role === 'EMPLOYEE') {
    activeBranchId = branchId;
  } else {
    activeBranchId = (req.headers['x-branch-id'] || req.query.branchId) as string || undefined;
  }

  req.tenant = {
    organizationId,
    branchId: activeBranchId
  };

  next();
};
