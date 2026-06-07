import nodemailer from 'nodemailer';
import { logger } from './logger';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

transporter.verify((error) => {
  if (error) {
    logger.warn('SMTP transport connection issue: ' + error.message);
  } else {
    logger.info('SMTP Server is ready to take messages');
  }
});
export const mailFrom = process.env.SMTP_FROM || 'Karmsetu HR <noreply@karmsetu.com>';
