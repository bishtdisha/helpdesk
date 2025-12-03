import nodemailer from 'nodemailer';

// Email configuration
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'cssupport@cimconautomation.com',
    pass: process.env.SMTP_PASSWORD || '', // Set this in .env
  },
};

const FROM_EMAIL = 'cssupport@cimconautomation.com';
const FROM_NAME = 'CS Support - Cimcon Automation';

// Create reusable transporter
const transporter = nodemailer.createTransport(SMTP_CONFIG);

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  /**
   * Check if email is configured
   */
  static isConfigured(): boolean {
    return !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  }

  /**
   * Send an email
   */
  static async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      // Check if SMTP is configured
      if (!this.isConfigured()) {
        console.warn('⚠️  SMTP not configured. Email would be sent to:', options.to);
        console.warn('⚠️  Please configure SMTP_USER and SMTP_PASSWORD in .env file');
        // In development, we'll pretend it succeeded
        if (process.env.NODE_ENV === 'development') {
          console.log('📧 [DEV MODE] Email simulated successfully');
          return true;
        }
        return false;
      }

      const info = await transporter.sendMail({
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log('✅ Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      // In development, log the error but don't fail
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 [DEV MODE] Email sending failed but continuing...');
        return true;
      }
      return false;
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName?: string
  ): Promise<boolean> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #3b82f6;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 12px;
          }
          .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello${userName ? ' ' + userName : ''},</p>
            
            <p>We received a request to reset your password for your Cimcon Automation Helpdesk account.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <center>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </center>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #3b82f6;">${resetUrl}</p>
            
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>This link will expire in <strong>15 minutes</strong></li>
                <li>This link can only be used once</li>
                <li>If you didn't request this reset, please ignore this email</li>
              </ul>
            </div>
            
            <p>For security reasons, we recommend:</p>
            <ul>
              <li>Using a strong, unique password</li>
              <li>Not sharing your password with anyone</li>
              <li>Changing your password regularly</li>
            </ul>
            
            <p>If you have any questions or concerns, please contact our support team.</p>
            
            <p>Best regards,<br>
            <strong>CS Support Team</strong><br>
            Cimcon Automation</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Cimcon Automation. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Password Reset Request

Hello${userName ? ' ' + userName : ''},

We received a request to reset your password for your Cimcon Automation Helpdesk account.

Click the link below to reset your password:
${resetUrl}

⚠️ Important:
- This link will expire in 15 minutes
- This link can only be used once
- If you didn't request this reset, please ignore this email

Best regards,
CS Support Team
Cimcon Automation
    `;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request - Cimcon Automation Helpdesk',
      html,
      text,
    });
  }

  /**
   * Send password reset confirmation email
   */
  static async sendPasswordResetConfirmation(
    email: string,
    userName?: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #10b981;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 12px;
          }
          .success {
            background-color: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Password Reset Successful</h1>
          </div>
          <div class="content">
            <p>Hello${userName ? ' ' + userName : ''},</p>
            
            <div class="success">
              <strong>Your password has been successfully reset.</strong>
            </div>
            
            <p>You can now log in to your Cimcon Automation Helpdesk account using your new password.</p>
            
            <p><strong>If you did not make this change:</strong></p>
            <ul>
              <li>Please contact our support team immediately</li>
              <li>Your account security may be compromised</li>
            </ul>
            
            <p>For security tips, please visit our help center or contact support.</p>
            
            <p>Best regards,<br>
            <strong>CS Support Team</strong><br>
            Cimcon Automation</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Cimcon Automation. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Password Reset Successful

Hello${userName ? ' ' + userName : ''},

Your password has been successfully reset.

You can now log in to your Cimcon Automation Helpdesk account using your new password.

If you did not make this change, please contact our support team immediately.

Best regards,
CS Support Team
Cimcon Automation
    `;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset Successful - Cimcon Automation Helpdesk',
      html,
      text,
    });
  }
}
