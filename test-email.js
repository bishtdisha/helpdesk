// Quick SMTP Test Script
// Run with: node test-email.js

const nodemailer = require('nodemailer');
require('dotenv').config();

async function testSMTP() {
  console.log('🔍 Testing SMTP Configuration...\n');

  console.log('Configuration:');
  console.log('  SMTP_HOST:', process.env.SMTP_HOST);
  console.log('  SMTP_PORT:', process.env.SMTP_PORT);
  console.log('  SMTP_USER:', process.env.SMTP_USER);
  console.log('  SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '***' + process.env.SMTP_PASSWORD.slice(-4) : 'NOT SET');
  console.log('');

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('❌ SMTP_USER or SMTP_PASSWORD not configured in .env file');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  try {
    console.log('📧 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: `"CS Support - Cimcon Automation" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to yourself for testing
      subject: 'Test Email - Helpdesk System',
      text: 'This is a test email from your helpdesk system. If you receive this, SMTP is configured correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #3b82f6;">✅ SMTP Test Successful!</h2>
          <p>This is a test email from your helpdesk system.</p>
          <p>If you receive this, your SMTP configuration is working correctly!</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            Sent from: ${process.env.SMTP_USER}<br>
            SMTP Host: ${process.env.SMTP_HOST}<br>
            SMTP Port: ${process.env.SMTP_PORT}
          </p>
        </div>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   To:', process.env.SMTP_USER);
    console.log('\n📬 Check your inbox at:', process.env.SMTP_USER);
    console.log('   (Also check spam folder if not in inbox)\n');
  } catch (error) {
    console.error('❌ SMTP Error:', error.message);
    console.error('\nCommon issues:');
    console.error('  1. Using regular password instead of App Password');
    console.error('  2. 2-Step Verification not enabled on Gmail');
    console.error('  3. Incorrect email or password');
    console.error('  4. Port 587 blocked by firewall');
    console.error('\nSolution: Generate Gmail App Password');
    console.error('  1. Go to: https://myaccount.google.com/security');
    console.error('  2. Enable 2-Step Verification');
    console.error('  3. Go to App passwords');
    console.error('  4. Generate password for "Mail"');
    console.error('  5. Update SMTP_PASSWORD in .env file\n');
    process.exit(1);
  }
}

testSMTP();
