import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Support both EMAIL_* and MAIL_* environment variable names
    const host = this.configService.get<string>('EMAIL_HOST') || this.configService.get<string>('MAIL_HOST');
    const port = this.configService.get<number>('EMAIL_PORT') || this.configService.get<number>('MAIL_PORT');
    const user = this.configService.get<string>('EMAIL_USER') || this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS') || this.configService.get<string>('MAIL_PASS');
    
    console.log('Email Config Debug:');
    console.log('HOST:', host || 'NOT SET');
    console.log('PORT:', port || 'NOT SET');
    console.log('USER:', user || 'NOT SET');
    console.log('PASS:', pass ? '***' : 'NOT SET');
    
    // Validate required email configuration
    if (!host || !port || !user || !pass) {
      const missing: string[] = [];
      if (!host) missing.push('EMAIL_HOST or MAIL_HOST');
      if (!port) missing.push('EMAIL_PORT or MAIL_PORT');
      if (!user) missing.push('EMAIL_USER or MAIL_USER');
      if (!pass) missing.push('EMAIL_PASS or MAIL_PASS');
      
      console.error(`⚠️  Email configuration incomplete. Missing: ${missing.join(', ')}`);
      console.error('⚠️  Email sending will fail. Please set the required environment variables.');
      throw new Error(`Email configuration incomplete. Missing: ${missing.join(', ')}`);
    }
    
    this.transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: port === 465, // Use secure connection for port 465
      auth: {
        user: user,
        pass: pass,
      },
    });
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    const fromEmail = this.configService.get<string>('EMAIL_USER') || this.configService.get<string>('MAIL_USER');
    
    const mailOptions = {
      from: fromEmail,
      to,
      subject,
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }
}
