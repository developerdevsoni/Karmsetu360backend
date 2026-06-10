import { Request, Response, NextFunction } from 'express';
import { OnboardingService } from '../service/onboarding.service';
import { sendResponse } from '../../../utils/response';

export class OnboardingController {
  public static createOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await OnboardingService.createOrganization(req.body);
      sendResponse(res, 201, true, 'Organization created successfully', result);
    } catch (error) {
      next(error);
    }
  };

  public static registerAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await OnboardingService.registerAdmin(req.body);
      sendResponse(res, 201, true, 'Admin user registered successfully', result);
    } catch (error) {
      next(error);
    }
  };
}
