import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRepository } from '../repository/auth.repository';
import { AppError } from '../../../utils/response';
import { EmailService } from '../../../utils/email.service';
import { prisma } from '../../../config/database';

export class AuthService {
  public static async login(email: string, password: string, deviceToken?: string) {
    const user = await AuthRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password credentials.', 401);
    }

    if (user.status === 'INACTIVE') {
      throw new AppError('This user account has been deactivated. Please contact your system HR.', 403);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password credentials.', 401);
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role.roleType,
      permissions: user.role.permissions.map((p) => `${p.action}:${p.resource}`),
      organizationId: user.organizationId || undefined,
      branchId: user.employeeProfile?.branchId || undefined
    };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_ACCESS_SECRET || 'super_secret_access_token_key',
      { expiresIn: (process.env.JWT_ACCESS_EXPIRY || '15m') as any }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_token_key',
      { expiresIn: (process.env.JWT_REFRESH_EXPIRY || '7d') as any }
    );

    // Append token to sessions list (token rotation support)
    const activeTokens = [...user.refreshTokens, refreshToken];
    await AuthRepository.updateRefreshTokens(user.id, activeTokens);

    if (deviceToken) {
      await AuthRepository.addDeviceToken(user.id, deviceToken);
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        organizationId: user.organizationId,
        branchId: user.employeeProfile?.branchId
      }
    };
  }

  public static async logout(userId: string, refreshToken: string, deviceToken?: string) {
    const user = await AuthRepository.findById(userId);
    if (user) {
      const activeTokens = user.refreshTokens.filter((t) => t !== refreshToken);
      await AuthRepository.updateRefreshTokens(userId, activeTokens);
      
      if (deviceToken) {
        await AuthRepository.removeDeviceToken(userId, deviceToken);
      }
    }
  }

  public static async refresh(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_token_key') as { userId: string };
      const user = await AuthRepository.findById(decoded.userId);
      
      if (!user || !user.refreshTokens.includes(token)) {
        // Revoke all tokens if a compromised refresh token is reused
        if (user) {
          await AuthRepository.updateRefreshTokens(user.id, []);
        }
        throw new AppError('Refresh token reuse detected. All sessions revoked.', 401);
      }

      // Rotate tokens
      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role.roleType,
        permissions: user.role.permissions.map((p) => `${p.action}:${p.resource}`),
        organizationId: user.organizationId || undefined,
        branchId: user.employeeProfile?.branchId || undefined
      };

      const newAccessToken = jwt.sign(
        payload,
        process.env.JWT_ACCESS_SECRET || 'super_secret_access_token_key',
        { expiresIn: (process.env.JWT_ACCESS_EXPIRY || '15m') as any }
      );

      const newRefreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_token_key',
        { expiresIn: (process.env.JWT_REFRESH_EXPIRY || '7d') as any }
      );

      const updatedTokens = user.refreshTokens.filter((t) => t !== token).concat(newRefreshToken);
      await AuthRepository.updateRefreshTokens(user.id, updatedTokens);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (e: any) {
      throw new AppError('Session refresh validation failed: ' + e.message, 401);
    }
  }

  public static async forgotPassword(email: string) {
    const user = await AuthRepository.findByEmail(email);
    if (!user) {
      // Silence user checking to prevent mail-harvesting enumeration attacks
      return;
    }

    const resetToken = jwt.sign(
      { userId: user.id, purpose: 'password-reset' },
      process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_token_key',
      { expiresIn: '1h' as any }
    );

    const resetUrl = `https://karmsetu.com/reset-password?token=${resetToken}`;
    await EmailService.queueEmail(user.email, 'Reset Password Request - Karmsetu', 'PASSWORD_RESET', {
      name: user.name,
      resetUrl
    });
  }

  public static async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_token_key') as { userId: string; purpose: string };
      if (decoded.purpose !== 'password-reset') {
        throw new AppError('Invalid token usage parameter.', 400);
      }

      const user = await AuthRepository.findById(decoded.userId);
      if (!user) {
        throw new AppError('User account not found.', 404);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashedPassword,
          refreshTokens: [] // Log out user across all active clients
        }
      });
    } catch (error: any) {
      throw new AppError('Reset token invalid or has expired: ' + error.message, 400);
    }
  }
}
