import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../service/auth.service';
import { sendResponse } from '../../../utils/response';

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, deviceToken } = req.body;
      const result = await AuthService.login(email, password, deviceToken);
      return sendResponse(res, 200, true, 'Logged in successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken, deviceToken } = req.body;
      const userId = req.user?.userId;
      
      if (userId) {
        await AuthService.logout(userId, refreshToken, deviceToken);
      }
      return sendResponse(res, 200, true, 'Session logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refresh(refreshToken);
      return sendResponse(res, 200, true, 'Token credentials refreshed successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await AuthService.forgotPassword(email);
      return sendResponse(res, 200, true, 'If the email matches our records, a password reset link has been dispatched.');
    } catch (error) {
      next(error);
    }
  }

  public static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      await AuthService.resetPassword(token, newPassword);
      return sendResponse(res, 200, true, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
}
