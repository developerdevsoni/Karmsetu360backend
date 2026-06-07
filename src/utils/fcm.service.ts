import { logger } from '../config/logger';
import { prisma } from '../config/database';
import { NotificationType } from '@prisma/client';

let admin: any = null;
try {
  admin = require('firebase-admin');
} catch (e) {
  logger.warn('firebase-admin is not installed. FCM notifications will use local logger mode.');
}

let fcmInitialized = false;

if (admin) {
  try {
    const projectId = process.env.FCM_PROJECT_ID;
    const clientEmail = process.env.FCM_CLIENT_EMAIL;
    const privateKey = process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      fcmInitialized = true;
      logger.info('Firebase Admin SDK initialized successfully for FCM');
    } else {
      logger.info('FCM credentials missing. Push notifications will execute in debug console log mode.');
    }
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK: ' + error);
  }
}

export class FcmService {
  public static async queueNotification(userId: string, title: string, body: string, type: string) {
    try {
      (async () => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { deviceTokens: true }
        });

        const tokens = user?.deviceTokens || [];

        await prisma.notification.create({
          data: {
            userId,
            title,
            body,
            type: type as NotificationType
          }
        });

        if (tokens.length > 0) {
          await FcmService.sendPushDirect(tokens, title, body, type);
        } else {
          logger.debug(`No device tokens registered for user ${userId}. Saved DB log and skipped push.`);
        }
      })().catch((err) => {
        logger.error(`Failed to execute async push notification for user ${userId}: ${err.message}`);
      });

      logger.info(`Asynchronous push notification process initiated for user ${userId} [Type: ${type}]`);
    } catch (error: any) {
      logger.error(`Failed to initiate push notification for user ${userId}: ${error.message}`);
    }
  }

  public static async sendPushDirect(deviceTokens: string[], title: string, body: string, type: string) {
    if (!deviceTokens || deviceTokens.length === 0) {
      return;
    }

    const payload = {
      notification: {
        title,
        body,
      },
      data: {
        type,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    };

    if (fcmInitialized && admin) {
      try {
        const response = await admin.messaging().sendEachForMulticast({
          tokens: deviceTokens,
          notification: payload.notification,
          data: payload.data,
        });
        logger.info(`FCM push delivery status: ${response.successCount} sent, ${response.failureCount} failed.`);
      } catch (error) {
        logger.error(`FCM direct send invocation failed: ${error}`);
      }
    } else {
      logger.info(`[MOCK PUSH] Sent to tokens [${deviceTokens.join(', ')}] -> Title: "${title}" | Body: "${body}" | Type: ${type}`);
    }
  }
}
