import nodemailer from 'nodemailer';

// Email configuration
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
  },
};

const FROM_EMAIL = process.env.SMTP_FROM || 'cssupport@cimconautomation.com';
const FROM_NAME = 'CS Support - Cimcon Automation';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Email signature
const EMAIL_SIGNATURE = {
  name: 'Bhavyata Jethwa',
  title: 'Customer Success Executive',
};

const transporter = nodemailer.createTransport(SMTP_CONFIG);

/**
 * Generate HTML email footer (inside the main box)
 */
function getEmailFooterHtml(): string {
  return `
          <!-- Footer -->
          <tr>
            <td bgcolor="#f9fafb" style="padding:20px 40px; border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 5px 0; font-size:13px; color:#6b7280; text-align:center; font-family:Arial, Helvetica, sans-serif;">
                This is an automated message from the Helpdesk System
              </p>
              <p style="margin:0; font-size:12px; color:#9ca3af; text-align:center; font-family:Arial, Helvetica, sans-serif;">
                &copy; ${new Date().getFullYear()} Cimcon Automation. All rights reserved.
              </p>
            </td>
          </tr>`;
}

/**
 * Generate HTML signature (outside the main box)
 */
function getEmailSignatureHtml(): string {
  return `
      <!-- Signature (outside the main box) -->
      <tr>
        <td align="center" style="padding:25px 20px 10px 20px;">
          <table width="600" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding:0;">
                <p style="margin:0 0 5px 0; font-size:14px; color:#374151; font-family:Arial, Helvetica, sans-serif;">
                  Best Regards,
                </p>
                <p style="margin:0 0 3px 0; font-size:14px; color:#111827; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">
                  ${EMAIL_SIGNATURE.name}
                </p>
                <p style="margin:0; font-size:13px; color:#6b7280; font-family:Arial, Helvetica, sans-serif;">
                  ${EMAIL_SIGNATURE.title}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
}

/**
 * Generate plain text email signature
 */
function getEmailSignatureText(): string {
  return `
Best Regards,
${EMAIL_SIGNATURE.name}
${EMAIL_SIGNATURE.title}

---
CS Support Team - Cimcon Automation
`;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  cc?: string[];
}

export class EmailService {
  static isConfigured(): boolean {
    return !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  }

  static async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.warn('⚠️  SMTP not configured. Email would be sent to:', options.to);
        if (process.env.NODE_ENV === 'development') {
          console.log('📧 [DEV MODE] Email simulated successfully');
          return true;
        }
        return false;
      }

      const mailOptions: any = {
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      if (options.cc && options.cc.length > 0) {
        mailOptions.cc = options.cc.join(', ');
      }

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      if (process.env.NODE_ENV === 'development') {
        return true;
      }
      return false;
    }
  }

  /**
   * Send ticket assignment notification email
   */
  static async sendTicketAssignmentEmail(
    assigneeEmail: string,
    assigneeName: string,
    ticketData: {
      id: string;
      ticketNumber: number;
      title: string;
      description: string;
      priority: string;
      category?: string;
      customerName?: string;
      creatorName?: string;
    },
    ccEmails?: string[]
  ): Promise<boolean> {
    const ticketUrl = `${APP_URL}/helpdesk/tickets/${ticketData.id}`;
    
    const priorityStyles: Record<string, { bg: string; color: string }> = {
      LOW: { bg: '#dcfce7', color: '#166534' },
      MEDIUM: { bg: '#fef3c7', color: '#92400e' },
      HIGH: { bg: '#fed7aa', color: '#c2410c' },
      URGENT: { bg: '#fecaca', color: '#dc2626' },
    };
    const priority = priorityStyles[ticketData.priority] || { bg: '#e5e7eb', color: '#374151' };

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .button-link { padding: 14px 30px !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border:1px solid #e5e7eb;">
          
          <!-- Header -->
          <tr>
            <td align="center" bgcolor="#2563eb" style="padding:30px 40px;">
              <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">
                New Ticket Assigned to You
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:30px 40px;">
              <p style="margin:0 0 20px 0; font-size:16px; color:#374151; font-family:Arial, Helvetica, sans-serif;">
                Hello <strong>${assigneeName}</strong>,
              </p>
              <p style="margin:0 0 25px 0; font-size:15px; color:#4b5563; line-height:24px; font-family:Arial, Helvetica, sans-serif;">
                A new ticket has been assigned to you. Please review the details below:
              </p>
              
              <!-- Ticket Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb; border:1px solid #e5e7eb; margin-bottom:25px;">
                <!-- Ticket Number & Priority Row -->
                <tr>
                  <td style="padding:20px; border-bottom:1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="50%" valign="middle">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td bgcolor="#dbeafe" style="padding:6px 14px; border-radius:4px;">
                                <span style="color:#1e40af; font-size:13px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">Ticket #${ticketData.ticketNumber}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td width="50%" align="right" valign="middle">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td bgcolor="${priority.bg}" style="padding:6px 14px; border-radius:4px;">
                                <span style="color:${priority.color}; font-size:13px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">${ticketData.priority}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Title Row -->
                <tr>
                  <td style="padding:20px; border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0 0 5px 0; font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:1px; font-family:Arial, Helvetica, sans-serif;">TITLE</p>
                    <p style="margin:0; font-size:16px; color:#111827; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">${ticketData.title}</p>
                  </td>
                </tr>
                
                <!-- Details Row -->
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      ${ticketData.category ? `
                      <tr>
                        <td width="120" style="padding:8px 0; font-size:13px; color:#6b7280; font-family:Arial, Helvetica, sans-serif;">Category:</td>
                        <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; font-family:Arial, Helvetica, sans-serif;">${ticketData.category}</td>
                      </tr>
                      ` : ''}
                      ${ticketData.customerName ? `
                      <tr>
                        <td width="120" style="padding:8px 0; font-size:13px; color:#6b7280; font-family:Arial, Helvetica, sans-serif;">Customer:</td>
                        <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; font-family:Arial, Helvetica, sans-serif;">${ticketData.customerName}</td>
                      </tr>
                      ` : ''}
                      ${ticketData.creatorName ? `
                      <tr>
                        <td width="120" style="padding:8px 0; font-size:13px; color:#6b7280; font-family:Arial, Helvetica, sans-serif;">Created By:</td>
                        <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; font-family:Arial, Helvetica, sans-serif;">${ticketData.creatorName}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Description Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:25px;">
                <tr>
                  <td width="4" bgcolor="#2563eb"></td>
                  <td bgcolor="#eff6ff" style="padding:15px 20px;">
                    <p style="margin:0 0 8px 0; font-size:11px; color:#1e40af; text-transform:uppercase; letter-spacing:1px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">DESCRIPTION</p>
                    <p style="margin:0; font-size:14px; color:#374151; line-height:22px; font-family:Arial, Helvetica, sans-serif;">${ticketData.description.replace(/\n/g, '<br>')}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                <tr>
                  <td align="center" style="padding:10px 0;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${ticketUrl}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="10%" strokecolor="#2563eb" fillcolor="#2563eb">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">View Ticket Details</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${ticketUrl}" style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; padding:14px 30px; border-radius:6px; font-size:15px; font-weight:bold; font-family:Arial, Helvetica, sans-serif; border:1px solid #2563eb;">
                      View Ticket Details
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
              
              <p style="margin:0; font-size:13px; color:#6b7280; text-align:center; font-family:Arial, Helvetica, sans-serif;">
                Please address this ticket according to its priority level.
              </p>
            </td>
          </tr>
          
          ${getEmailFooterHtml()}
          
        </table>
      </td>
    </tr>
    
    ${getEmailSignatureHtml()}
    
  </table>
</body>
</html>`;

    const text = `
New Ticket Assigned to You

Hello ${assigneeName},

A new ticket has been assigned to you:

Ticket #${ticketData.ticketNumber}
Title: ${ticketData.title}
Priority: ${ticketData.priority}
${ticketData.category ? `Category: ${ticketData.category}` : ''}
${ticketData.customerName ? `Customer: ${ticketData.customerName}` : ''}
${ticketData.creatorName ? `Created By: ${ticketData.creatorName}` : ''}

Description:
${ticketData.description}

View ticket: ${ticketUrl}
${getEmailSignatureText()}`;

    return this.sendEmail({
      to: assigneeEmail,
      subject: `[Ticket #${ticketData.ticketNumber}] New Ticket Assigned: ${ticketData.title}`,
      html,
      text,
      cc: ccEmails,
    });
  }

  /**
   * Send ticket resolved/closed notification email
   */
  static async sendTicketClosedEmail(
    recipientEmail: string,
    recipientName: string,
    ticketData: {
      id: string;
      ticketNumber: number;
      title: string;
      priority: string;
      status?: string;
      category?: string;
      customerName?: string;
      closedByName?: string;
      resolution?: string;
    },
    ccEmails?: string[]
  ): Promise<boolean> {
    const ticketUrl = `${APP_URL}/helpdesk/tickets/${ticketData.id}`;
    const isResolved = ticketData.status === 'RESOLVED';
    const statusText = isResolved ? 'Resolved' : 'Closed';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
  </style>
  <![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border:1px solid #e5e7eb;">
          
          <!-- Header -->
          <tr>
            <td align="center" bgcolor="#16a34a" style="padding:30px 40px;">
              <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">
                Ticket ${statusText}
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:30px 40px;">
              <p style="margin:0 0 20px 0; font-size:16px; color:#374151; font-family:Arial, Helvetica, sans-serif;">
                Hello <strong>${recipientName}</strong>,
              </p>
              <p style="margin:0 0 25px 0; font-size:15px; color:#4b5563; line-height:24px; font-family:Arial, Helvetica, sans-serif;">
                The following ticket has been ${statusText.toLowerCase()}. Thank you for your patience.
              </p>
              
              <!-- Ticket Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0fdf4; border:1px solid #bbf7d0; margin-bottom:25px;">
                <!-- Ticket Number & Status Row -->
                <tr>
                  <td style="padding:20px; border-bottom:1px solid #bbf7d0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="50%" valign="middle">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td bgcolor="#dbeafe" style="padding:6px 14px; border-radius:4px;">
                                <span style="color:#1e40af; font-size:13px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">Ticket #${ticketData.ticketNumber}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td width="50%" align="right" valign="middle">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td bgcolor="#dcfce7" style="padding:6px 14px; border-radius:4px;">
                                <span style="color:#166534; font-size:13px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">✓ ${statusText.toUpperCase()}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Title Row -->
                <tr>
                  <td style="padding:20px; border-bottom:1px solid #bbf7d0;">
                    <p style="margin:0 0 5px 0; font-size:11px; color:#166534; text-transform:uppercase; letter-spacing:1px; font-family:Arial, Helvetica, sans-serif;">TITLE</p>
                    <p style="margin:0; font-size:16px; color:#111827; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">${ticketData.title}</p>
                  </td>
                </tr>
                
                <!-- Details Row -->
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      ${ticketData.category ? `
                      <tr>
                        <td width="120" style="padding:8px 0; font-size:13px; color:#6b7280; font-family:Arial, Helvetica, sans-serif;">Category:</td>
                        <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; font-family:Arial, Helvetica, sans-serif;">${ticketData.category}</td>
                      </tr>
                      ` : ''}
                      ${ticketData.customerName ? `
                      <tr>
                        <td width="120" style="padding:8px 0; font-size:13px; color:#6b7280; font-family:Arial, Helvetica, sans-serif;">Customer:</td>
                        <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; font-family:Arial, Helvetica, sans-serif;">${ticketData.customerName}</td>
                      </tr>
                      ` : ''}
                      ${ticketData.closedByName ? `
                      <tr>
                        <td width="120" style="padding:8px 0; font-size:13px; color:#6b7280; font-family:Arial, Helvetica, sans-serif;">${statusText} By:</td>
                        <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; font-family:Arial, Helvetica, sans-serif;">${ticketData.closedByName}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              ${ticketData.resolution ? `
              <!-- Resolution Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:25px;">
                <tr>
                  <td width="4" bgcolor="#16a34a"></td>
                  <td bgcolor="#f0fdf4" style="padding:15px 20px;">
                    <p style="margin:0 0 8px 0; font-size:11px; color:#166534; text-transform:uppercase; letter-spacing:1px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">RESOLUTION</p>
                    <p style="margin:0; font-size:14px; color:#374151; line-height:22px; font-family:Arial, Helvetica, sans-serif;">${ticketData.resolution.replace(/\n/g, '<br>')}</p>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                <tr>
                  <td align="center" style="padding:10px 0;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${ticketUrl}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="10%" strokecolor="#16a34a" fillcolor="#16a34a">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">View Ticket Details</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${ticketUrl}" style="display:inline-block; background-color:#16a34a; color:#ffffff; text-decoration:none; padding:14px 30px; border-radius:6px; font-size:15px; font-weight:bold; font-family:Arial, Helvetica, sans-serif; border:1px solid #16a34a;">
                      View Ticket Details
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
              
              <p style="margin:0; font-size:13px; color:#6b7280; text-align:center; font-family:Arial, Helvetica, sans-serif;">
                If you have any questions, please contact our support team.
              </p>
            </td>
          </tr>
          
          ${getEmailFooterHtml()}
          
        </table>
      </td>
    </tr>
    
    ${getEmailSignatureHtml()}
    
  </table>
</body>
</html>`;

    const text = `
Ticket ${statusText}

Hello ${recipientName},

The following ticket has been ${statusText.toLowerCase()}:

Ticket #${ticketData.ticketNumber}
Title: ${ticketData.title}
Status: ${ticketData.status || 'CLOSED'}
${ticketData.category ? `Category: ${ticketData.category}` : ''}
${ticketData.customerName ? `Customer: ${ticketData.customerName}` : ''}
${ticketData.closedByName ? `${statusText} By: ${ticketData.closedByName}` : ''}
${ticketData.resolution ? `\nResolution:\n${ticketData.resolution}` : ''}

View ticket: ${ticketUrl}
${getEmailSignatureText()}`;

    return this.sendEmail({
      to: recipientEmail,
      subject: `[Ticket #${ticketData.ticketNumber}] Ticket ${statusText}: ${ticketData.title}`,
      html,
      text,
      cc: ccEmails,
    });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName?: string
  ): Promise<boolean> {
    const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#f59e0b; padding:30px 40px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:bold;">
                🔐 Password Reset Request
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:30px 40px;">
              <p style="margin:0 0 20px 0; font-size:16px; color:#374151;">
                Hello${userName ? ` <strong>${userName}</strong>` : ''},
              </p>
              <p style="margin:0 0 25px 0; font-size:15px; color:#4b5563; line-height:1.5;">
                We received a request to reset your password for your Cimcon Automation Helpdesk account.
              </p>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:10px 0 25px 0;">
                    <a href="${resetUrl}" style="display:inline-block; background-color:#f59e0b; color:#ffffff; text-decoration:none; padding:14px 30px; border-radius:6px; font-size:15px; font-weight:bold;">
                      Reset Password →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Warning Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:25px;">
                <tr>
                  <td style="background-color:#fef3c7; border-left:4px solid #f59e0b; padding:15px 20px; border-radius:0 8px 8px 0;">
                    <p style="margin:0 0 8px 0; font-size:13px; color:#92400e; font-weight:bold;">⚠️ Important</p>
                    <p style="margin:0; font-size:13px; color:#92400e; line-height:1.5;">
                      • This link will expire in <strong>15 minutes</strong><br>
                      • This link can only be used once<br>
                      • If you didn't request this, please ignore this email
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin:0; font-size:13px; color:#6b7280; text-align:center;">
                If the button doesn't work, copy this link:<br>
                <a href="${resetUrl}" style="color:#2563eb; word-break:break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          
          ${getEmailFooterHtml()}
          
        </table>
      </td>
    </tr>
    
    ${getEmailSignatureHtml()}
    
  </table>
</body>
</html>`;

    const text = `
Password Reset Request

Hello${userName ? ` ${userName}` : ''},

We received a request to reset your password.

Click here to reset: ${resetUrl}

Important:
- This link expires in 15 minutes
- This link can only be used once
- If you didn't request this, ignore this email
${getEmailSignatureText()}`;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request - Cimcon Automation Helpdesk',
      html,
      text,
    });
  }

  /**
   * Send ticket reopened notification email
   */
  static async sendTicketReopenedEmail(
    recipientEmail: string,
    recipientName: string,
    ticketData: {
      id: string;
      ticketNumber: number;
      title: string;
      priority: string;
      category?: string;
      customerName?: string;
      reopenedByName?: string;
    },
    ccEmails?: string[]
  ): Promise<boolean> {
    const ticketUrl = `${APP_URL}/helpdesk/tickets/${ticketData.id}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
  </style>
  <![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border:1px solid #e5e7eb;">
          
          <!-- Header -->
          <tr>
            <td align="center" bgcolor="#f59e0b" style="padding:30px 40px;">
              <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">
                Ticket Reopened
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:30px 40px;">
              <p style="margin:0 0 20px 0; font-size:16px; color:#374151; font-family:Arial, Helvetica, sans-serif;">
                Hello <strong>${recipientName}</strong>,
              </p>
              <p style="margin:0 0 25px 0; font-size:15px; color:#4b5563; line-height:24px; font-family:Arial, Helvetica, sans-serif;">
                A ticket has been reopened and requires your attention.
              </p>
              
              <!-- Ticket Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fffbeb; border:1px solid #fcd34d; margin-bottom:25px;">
                <!-- Ticket Number & Status Row -->
                <tr>
                  <td style="padding:20px; border-bottom:1px solid #fcd34d;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="50%" valign="middle">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td bgcolor="#dbeafe" style="padding:6px 14px; border-radius:4px;">
                                <span style="color:#1e40af; font-size:13px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">Ticket #${ticketData.ticketNumber}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td width="50%" align="right" valign="middle">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td bgcolor="#fef3c7" style="padding:6px 14px; border-radius:4px;">
                                <span style="color:#92400e; font-size:13px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">&#8635; REOPENED</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Title Row -->
                <tr>
                  <td style="padding:20px; border-bottom:1px solid #fcd34d;">
                    <p style="margin:0 0 5px 0; font-size:11px; color:#92400e; text-transform:uppercase; letter-spacing:1px; font-family:Arial, Helvetica, sans-serif;">TITLE</p>
                    <p style="margin:0; font-size:16px; color:#111827; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">${ticketData.title}</p>
                  </td>
                </tr>
                
                <!-- Details Row -->
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="120" style="padding:8px 0; font-size:13px; color:#6b7280; font-family:Arial, Helvetica, sans-serif;">Priority:</td>
                        <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; font-family:Arial, Helvetica, sans-serif;">${ticketData.priority}</td>
                      </tr>
                      ${ticketData.category ? `
                      <tr>
                        <td width="120" style="padding:8px 0; font-size:13px; color:#6b7280; font-family:Arial, Helvetica, sans-serif;">Category:</td>
                        <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; font-family:Arial, Helvetica, sans-serif;">${ticketData.category}</td>
                      </tr>
                      ` : ''}
                      ${ticketData.customerName ? `
                      <tr>
                        <td width="120" style="padding:8px 0; font-size:13px; color:#6b7280; font-family:Arial, Helvetica, sans-serif;">Customer:</td>
                        <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; font-family:Arial, Helvetica, sans-serif;">${ticketData.customerName}</td>
                      </tr>
                      ` : ''}
                      ${ticketData.reopenedByName ? `
                      <tr>
                        <td width="120" style="padding:8px 0; font-size:13px; color:#6b7280; font-family:Arial, Helvetica, sans-serif;">Reopened By:</td>
                        <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; font-family:Arial, Helvetica, sans-serif;">${ticketData.reopenedByName}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                <tr>
                  <td align="center" style="padding:10px 0;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${ticketUrl}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="10%" strokecolor="#f59e0b" fillcolor="#f59e0b">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">View Ticket Details</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${ticketUrl}" style="display:inline-block; background-color:#f59e0b; color:#ffffff; text-decoration:none; padding:14px 30px; border-radius:6px; font-size:15px; font-weight:bold; font-family:Arial, Helvetica, sans-serif; border:1px solid #f59e0b;">
                      View Ticket Details
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
              
              <p style="margin:0; font-size:13px; color:#6b7280; text-align:center; font-family:Arial, Helvetica, sans-serif;">
                Please review and address this ticket as soon as possible.
              </p>
            </td>
          </tr>
          
          ${getEmailFooterHtml()}
          
        </table>
      </td>
    </tr>
    
    ${getEmailSignatureHtml()}
    
  </table>
</body>
</html>`;

    const text = `
Ticket Reopened

Hello ${recipientName},

A ticket has been reopened and requires your attention:

Ticket #${ticketData.ticketNumber}
Title: ${ticketData.title}
Priority: ${ticketData.priority}
${ticketData.category ? `Category: ${ticketData.category}` : ''}
${ticketData.customerName ? `Customer: ${ticketData.customerName}` : ''}
${ticketData.reopenedByName ? `Reopened By: ${ticketData.reopenedByName}` : ''}

View ticket: ${ticketUrl}
${getEmailSignatureText()}`;

    return this.sendEmail({
      to: recipientEmail,
      subject: `[Ticket #${ticketData.ticketNumber}] Ticket Reopened: ${ticketData.title}`,
      html,
      text,
      cc: ccEmails,
    });
  }

  /**
   * Send ticket on hold notification email
   */
  static async sendTicketOnHoldEmail(
    recipientEmail: string,
    recipientName: string,
    ticketData: {
      id: string;
      ticketNumber: number;
      title: string;
      priority: string;
      category?: string;
      customerName?: string;
      changedByName?: string;
    },
    ccEmails?: string[]
  ): Promise<boolean> {
    const ticketUrl = `${APP_URL}/helpdesk/tickets/${ticketData.id}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
  </style>
  <![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border:1px solid #e5e7eb;">
          
          <!-- Header -->
          <tr>
            <td align="center" bgcolor="#6366f1" style="padding:30px 40px;">
              <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">
                Ticket On Hold
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:30px 40px;">
              <p style="margin:0 0 20px 0; font-size:16px; color:#374151; font-family:Arial, Helvetica, sans-serif;">
                Hello <strong>${recipientName}</strong>,
              </p>
              <p style="margin:0 0 25px 0; font-size:15px; color:#4b5563; line-height:24px; font-family:Arial, Helvetica, sans-serif;">
                A ticket has been placed on hold. This may require additional information or action from your side.
              </p>
              
              <!-- Ticket Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef2ff; border:1px solid #c7d2fe; margin-bottom:25px;">
                <!-- Ticket Number & Status Row -->
                <tr>
                  <td style="padding:20px; border-bottom:1px solid #c7d2fe;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="50%" valign="middle">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td bgcolor="#dbeafe" style="padding:6px 14px; border-radius:4px;">
                                <span style="color:#1e40af; font-size:13px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">Ticket #${ticketData.ticketNumber}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td width="50%" align="right" valign="middle">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td bgcolor="#e0e7ff" style="padding:6px 14px; border-radius:4px;">
                                <span style="color:#4338ca; font-size:13px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">&#9208; ON HOLD</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Title Row -->
                <tr>
                  <td style="padding:20px; border-bottom:1px solid #c7d2fe;">
                    <p style="margin:0 0 5px 0; font-size:11px; color:#4338ca; text-transform:uppercase; letter-spacing:1px; font-family:Arial, Helvetica, sans-serif;">TITLE</p>
                    <p style="margin:0; font-size:16px; color:#111827; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">${ticketData.title}</p>
                  </td>
                </tr>
                
                <!-- Details Row -->
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="120" style="padding:8px 0; font-size:13px; color:#6b7280; font-family:Arial, Helvetica, sans-serif;">Priority:</td>
                        <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; font-family:Arial, Helvetica, sans-serif;">${ticketData.priority}</td>
                      </tr>
                      ${ticketData.category ? `
                      <tr>
                        <td width="120" style="padding:8px 0; font-size:13px; color:#6b7280; font-family:Arial, Helvetica, sans-serif;">Category:</td>
                        <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; font-family:Arial, Helvetica, sans-serif;">${ticketData.category}</td>
                      </tr>
                      ` : ''}
                      ${ticketData.customerName ? `
                      <tr>
                        <td width="120" style="padding:8px 0; font-size:13px; color:#6b7280; font-family:Arial, Helvetica, sans-serif;">Customer:</td>
                        <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; font-family:Arial, Helvetica, sans-serif;">${ticketData.customerName}</td>
                      </tr>
                      ` : ''}
                      ${ticketData.changedByName ? `
                      <tr>
                        <td width="120" style="padding:8px 0; font-size:13px; color:#6b7280; font-family:Arial, Helvetica, sans-serif;">Changed By:</td>
                        <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; font-family:Arial, Helvetica, sans-serif;">${ticketData.changedByName}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                <tr>
                  <td align="center" style="padding:10px 0;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${ticketUrl}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="10%" strokecolor="#6366f1" fillcolor="#6366f1">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">View Ticket Details</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${ticketUrl}" style="display:inline-block; background-color:#6366f1; color:#ffffff; text-decoration:none; padding:14px 30px; border-radius:6px; font-size:15px; font-weight:bold; font-family:Arial, Helvetica, sans-serif; border:1px solid #6366f1;">
                      View Ticket Details
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
              
              <p style="margin:0; font-size:13px; color:#6b7280; text-align:center; font-family:Arial, Helvetica, sans-serif;">
                Please provide any required information to help resolve this ticket.
              </p>
            </td>
          </tr>
          
          ${getEmailFooterHtml()}
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = `
Ticket On Hold

Hello ${recipientName},

A ticket has been placed on hold:

Ticket #${ticketData.ticketNumber}
Title: ${ticketData.title}
Priority: ${ticketData.priority}
${ticketData.category ? `Category: ${ticketData.category}` : ''}
${ticketData.customerName ? `Customer: ${ticketData.customerName}` : ''}
${ticketData.changedByName ? `Changed By: ${ticketData.changedByName}` : ''}

This may require additional information or action from your side.

View ticket: ${ticketUrl}
${getEmailSignatureText()}`;

    return this.sendEmail({
      to: recipientEmail,
      subject: `[Ticket #${ticketData.ticketNumber}] Ticket On Hold: ${ticketData.title}`,
      html,
      text,
      cc: ccEmails,
    });
  }

  /**
   * Send mention notification email
   */
  static async sendMentionEmail(
    recipientEmail: string,
    recipientName: string,
    ticketData: {
      id: string;
      ticketNumber: number;
      title: string;
      commentContent: string;
      mentionedByName: string;
    }
  ): Promise<boolean> {
    const ticketUrl = `${APP_URL}/helpdesk/tickets/${ticketData.id}`;
    // Truncate comment if too long
    const truncatedComment = ticketData.commentContent.length > 500 
      ? ticketData.commentContent.substring(0, 500) + '...' 
      : ticketData.commentContent;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
  </style>
  <![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border:1px solid #e5e7eb;">
          
          <!-- Header -->
          <tr>
            <td align="center" bgcolor="#8b5cf6" style="padding:30px 40px;">
              <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">
                You Were Mentioned
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:30px 40px;">
              <p style="margin:0 0 20px 0; font-size:16px; color:#374151; font-family:Arial, Helvetica, sans-serif;">
                Hello <strong>${recipientName}</strong>,
              </p>
              <p style="margin:0 0 25px 0; font-size:15px; color:#4b5563; line-height:24px; font-family:Arial, Helvetica, sans-serif;">
                <strong>${ticketData.mentionedByName}</strong> mentioned you in a comment on a ticket.
              </p>
              
              <!-- Ticket Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f3ff; border:1px solid #ddd6fe; margin-bottom:25px;">
                <!-- Ticket Number Row -->
                <tr>
                  <td style="padding:20px; border-bottom:1px solid #ddd6fe;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td bgcolor="#dbeafe" style="padding:6px 14px; border-radius:4px;">
                                <span style="color:#1e40af; font-size:13px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">Ticket #${ticketData.ticketNumber}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Title Row -->
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 5px 0; font-size:11px; color:#7c3aed; text-transform:uppercase; letter-spacing:1px; font-family:Arial, Helvetica, sans-serif;">TICKET TITLE</p>
                    <p style="margin:0; font-size:16px; color:#111827; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">${ticketData.title}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Comment Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:25px;">
                <tr>
                  <td width="4" bgcolor="#8b5cf6"></td>
                  <td bgcolor="#f5f3ff" style="padding:15px 20px;">
                    <p style="margin:0 0 8px 0; font-size:11px; color:#7c3aed; text-transform:uppercase; letter-spacing:1px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">COMMENT</p>
                    <p style="margin:0; font-size:14px; color:#374151; line-height:22px; font-family:Arial, Helvetica, sans-serif;">${truncatedComment.replace(/\n/g, '<br>')}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                <tr>
                  <td align="center" style="padding:10px 0;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${ticketUrl}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="10%" strokecolor="#8b5cf6" fillcolor="#8b5cf6">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">View Ticket</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${ticketUrl}" style="display:inline-block; background-color:#8b5cf6; color:#ffffff; text-decoration:none; padding:14px 30px; border-radius:6px; font-size:15px; font-weight:bold; font-family:Arial, Helvetica, sans-serif; border:1px solid #8b5cf6;">
                      View Ticket
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
              
              <p style="margin:0; font-size:13px; color:#6b7280; text-align:center; font-family:Arial, Helvetica, sans-serif;">
                Click the button above to view the full conversation.
              </p>
            </td>
          </tr>
          
          ${getEmailFooterHtml()}
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = `
You Were Mentioned

Hello ${recipientName},

${ticketData.mentionedByName} mentioned you in a comment on Ticket #${ticketData.ticketNumber}:

Ticket: ${ticketData.title}

Comment:
${truncatedComment}

View ticket: ${ticketUrl}
${getEmailSignatureText()}`;

    return this.sendEmail({
      to: recipientEmail,
      subject: `[Ticket #${ticketData.ticketNumber}] ${ticketData.mentionedByName} mentioned you`,
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
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#16a34a; padding:30px 40px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:bold;">
                ✓ Password Reset Successful
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:30px 40px;">
              <p style="margin:0 0 20px 0; font-size:16px; color:#374151;">
                Hello${userName ? ` <strong>${userName}</strong>` : ''},
              </p>
              
              <!-- Success Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:25px;">
                <tr>
                  <td style="background-color:#f0fdf4; border:1px solid #bbf7d0; padding:20px; border-radius:8px; text-align:center;">
                    <p style="margin:0; font-size:15px; color:#166534; font-weight:500;">
                      ✓ Your password has been successfully reset
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin:0 0 25px 0; font-size:15px; color:#4b5563; line-height:1.5;">
                You can now log in to your account using your new password.
              </p>
              
              <!-- Warning Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:25px;">
                <tr>
                  <td style="background-color:#fef2f2; border-left:4px solid #ef4444; padding:15px 20px; border-radius:0 8px 8px 0;">
                    <p style="margin:0 0 8px 0; font-size:13px; color:#991b1b; font-weight:bold;">⚠️ Didn't make this change?</p>
                    <p style="margin:0; font-size:13px; color:#991b1b; line-height:1.5;">
                      If you did not reset your password, please contact our support team immediately.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:10px 0;">
                    <a href="${APP_URL}/login" style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; padding:14px 30px; border-radius:6px; font-size:15px; font-weight:bold;">
                      Login to Your Account →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          ${getEmailFooterHtml()}
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = `
Password Reset Successful

Hello${userName ? ` ${userName}` : ''},

Your password has been successfully reset.

You can now log in using your new password.

If you did not make this change, contact support immediately.
${getEmailSignatureText()}`;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset Successful - Cimcon Automation Helpdesk',
      html,
      text,
    });
  }

  /**
   * Send ticket status change notification email
   */
  static async sendTicketStatusChangeEmail(
    recipientEmail: string,
    recipientName: string,
    ticketData: {
      id: string;
      ticketNumber: number;
      title: string;
      priority: string;
      oldStatus: string;
      newStatus: string;
      category?: string;
      customerName?: string;
      changedByName?: string;
    },
    ccEmails?: string[]
  ): Promise<boolean> {
    const ticketUrl = `${APP_URL}/helpdesk/tickets/${ticketData.id}`;
    
    // Format status for display
    const formatStatus = (status: string) => status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const oldStatusFormatted = formatStatus(ticketData.oldStatus);
    const newStatusFormatted = formatStatus(ticketData.newStatus);
    
    // Determine color based on new status
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'OPEN': return { bg: '#dbeafe', text: '#1e40af', header: '#3b82f6' };
        case 'IN_PROGRESS': return { bg: '#fef3c7', text: '#92400e', header: '#f59e0b' };
        case 'WAITING_FOR_CUSTOMER': return { bg: '#fce7f3', text: '#9d174d', header: '#ec4899' };
        case 'RESOLVED': return { bg: '#dcfce7', text: '#166534', header: '#16a34a' };
        case 'CLOSED': return { bg: '#e5e7eb', text: '#374151', header: '#6b7280' };
        default: return { bg: '#dbeafe', text: '#1e40af', header: '#3b82f6' };
      }
    };
    const statusColor = getStatusColor(ticketData.newStatus);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
  </style>
  <![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border:1px solid #e5e7eb;">
          
          <!-- Header -->
          <tr>
            <td align="center" bgcolor="${statusColor.header}" style="padding:30px 40px;">
              <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">
                Ticket Status Updated
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:30px 40px;">
              <p style="margin:0 0 20px 0; font-size:16px; color:#374151; font-family:Arial, Helvetica, sans-serif;">
                Hello <strong>${recipientName}</strong>,
              </p>
              <p style="margin:0 0 25px 0; font-size:15px; color:#4b5563; line-height:24px; font-family:Arial, Helvetica, sans-serif;">
                The status of the following ticket has been updated.
              </p>
              
              <!-- Status Change Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb; border:1px solid #e5e7eb; margin-bottom:25px;">
                <tr>
                  <td style="padding:20px; text-align:center;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="45%" align="center" valign="middle">
                          <p style="margin:0 0 8px 0; font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:1px; font-family:Arial, Helvetica, sans-serif;">Previous Status</p>
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td bgcolor="#e5e7eb" style="padding:8px 16px; border-radius:4px;">
                                <span style="color:#374151; font-size:14px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">${oldStatusFormatted}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td width="10%" align="center" valign="middle">
                          <span style="font-size:24px; color:#9ca3af;">→</span>
                        </td>
                        <td width="45%" align="center" valign="middle">
                          <p style="margin:0 0 8px 0; font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:1px; font-family:Arial, Helvetica, sans-serif;">New Status</p>
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td bgcolor="${statusColor.bg}" style="padding:8px 16px; border-radius:4px;">
                                <span style="color:${statusColor.text}; font-size:14px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">${newStatusFormatted}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Ticket Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f9ff; border:1px solid #bae6fd; margin-bottom:25px;">
                <!-- Ticket Number Row -->
                <tr>
                  <td style="padding:20px; border-bottom:1px solid #bae6fd;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td bgcolor="#dbeafe" style="padding:6px 14px; border-radius:4px;">
                          <span style="color:#1e40af; font-size:13px; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">Ticket #${ticketData.ticketNumber}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Title Row -->
                <tr>
                  <td style="padding:20px; border-bottom:1px solid #bae6fd;">
                    <p style="margin:0 0 5px 0; font-size:11px; color:#0369a1; text-transform:uppercase; letter-spacing:1px; font-family:Arial, Helvetica, sans-serif;">TITLE</p>
                    <p style="margin:0; font-size:16px; color:#111827; font-weight:bold; font-family:Arial, Helvetica, sans-serif;">${ticketData.title}</p>
                  </td>
                </tr>
                
                <!-- Details Row -->
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="120" style="padding:8px 0; font-size:13px; color:#6b7280; font-family:Arial, Helvetica, sans-serif;">Priority:</td>
                        <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; font-family:Arial, Helvetica, sans-serif;">${ticketData.priority}</td>
                      </tr>
                      ${ticketData.category ? `
                      <tr>
                        <td width="120" style="padding:8px 0; font-size:13px; color:#6b7280; font-family:Arial, Helvetica, sans-serif;">Category:</td>
                        <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; font-family:Arial, Helvetica, sans-serif;">${ticketData.category}</td>
                      </tr>
                      ` : ''}
                      ${ticketData.customerName ? `
                      <tr>
                        <td width="120" style="padding:8px 0; font-size:13px; color:#6b7280; font-family:Arial, Helvetica, sans-serif;">Customer:</td>
                        <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; font-family:Arial, Helvetica, sans-serif;">${ticketData.customerName}</td>
                      </tr>
                      ` : ''}
                      ${ticketData.changedByName ? `
                      <tr>
                        <td width="120" style="padding:8px 0; font-size:13px; color:#6b7280; font-family:Arial, Helvetica, sans-serif;">Changed By:</td>
                        <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; font-family:Arial, Helvetica, sans-serif;">${ticketData.changedByName}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                <tr>
                  <td align="center" style="padding:10px 0;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${ticketUrl}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="10%" strokecolor="${statusColor.header}" fillcolor="${statusColor.header}">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">View Ticket Details</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${ticketUrl}" style="display:inline-block; background-color:${statusColor.header}; color:#ffffff; text-decoration:none; padding:14px 30px; border-radius:6px; font-size:15px; font-weight:bold; font-family:Arial, Helvetica, sans-serif; border:1px solid ${statusColor.header};">
                      View Ticket Details
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
              
              <p style="margin:0; font-size:13px; color:#6b7280; text-align:center; font-family:Arial, Helvetica, sans-serif;">
                If you have any questions, please contact our support team.
              </p>
            </td>
          </tr>
          
          ${getEmailFooterHtml()}
          
        </table>
      </td>
    </tr>
    
    ${getEmailSignatureHtml()}
    
  </table>
</body>
</html>`;

    const text = `
Ticket Status Updated

Hello ${recipientName},

The status of the following ticket has been updated:

Status Change: ${oldStatusFormatted} → ${newStatusFormatted}

Ticket #${ticketData.ticketNumber}
Title: ${ticketData.title}
Priority: ${ticketData.priority}
${ticketData.category ? `Category: ${ticketData.category}` : ''}
${ticketData.customerName ? `Customer: ${ticketData.customerName}` : ''}
${ticketData.changedByName ? `Changed By: ${ticketData.changedByName}` : ''}

View ticket: ${ticketUrl}
${getEmailSignatureText()}`;

    return this.sendEmail({
      to: recipientEmail,
      subject: `[Ticket #${ticketData.ticketNumber}] Status Changed to ${newStatusFormatted}: ${ticketData.title}`,
      html,
      text,
      cc: ccEmails,
    });
  }
}
