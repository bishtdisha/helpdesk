// Microsoft SMTP Diagnostic Test
const nodemailer = require('nodemailer');
require('dotenv').config();

async function testMicrosoftSMTP() {
  console.log('🔍 Microsoft SMTP Diagnostic Test\n');
  
  const configs = [
    {
      name: 'Office 365 - Port 587 (TLS)',
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      requireTLS: true,
    },
    {
      name: 'Office 365 - Port 25',
      host: 'smtp.office365.com',
      port: 25,
      secure: false,
      requireTLS: true,
    },
    {
      name: 'Outlook.com - Port 587',
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      requireTLS: true,
    },
  ];

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass) {
    console.error('❌ SMTP_USER or SMTP_PASSWORD not set in .env');
    return;
  }

  console.log('Testing with:');
  console.log('  Email:', user);
  console.log('  Password:', '***' + pass.slice(-4));
  console.log('');

  for (const config of configs) {
    console.log(`\n📧 Testing: ${config.name}`);
    console.log(`   Host: ${config.host}`);
    console.log(`   Port: ${config.port}`);
    
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      requireTLS: config.requireTLS,
      auth: {
        user: user,
        pass: pass,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false,
      },
      debug: false,
      logger: false,
    });

    try {
      await transporter.verify();
      console.log('   ✅ Connection successful!');
      
      // Try sending a test email
      console.log('   📧 Attempting to send test email...');
      const info = await transporter.sendMail({
        from: user,
        to: user,
        subject: 'Test Email - Helpdesk System',
        text: 'This is a test email. SMTP is working!',
        html: '<p>This is a test email. <strong>SMTP is working!</strong></p>',
      });
      
      console.log('   ✅ Email sent successfully!');
      console.log('   Message ID:', info.messageId);
      console.log('\n🎉 SUCCESS! This configuration works!');
      console.log('\nUpdate your .env file with:');
      console.log(`SMTP_HOST="${config.host}"`);
      console.log(`SMTP_PORT="${config.port}"`);
      return;
      
    } catch (error) {
      console.log('   ❌ Failed:', error.message);
      
      // Detailed error analysis
      if (error.message.includes('Authentication unsuccessful')) {
        console.log('   💡 Reason: Authentication failed');
        console.log('      - Password might be incorrect');
        console.log('      - SMTP AUTH might be disabled');
        console.log('      - May need App Password');
      } else if (error.message.includes('ECONNREFUSED')) {
        console.log('   💡 Reason: Connection refused');
        console.log('      - Port might be blocked');
        console.log('      - Firewall issue');
      } else if (error.message.includes('ETIMEDOUT')) {
        console.log('   💡 Reason: Connection timeout');
        console.log('      - Network issue');
        console.log('      - Port blocked by firewall');
      }
    }
  }

  console.log('\n\n❌ All configurations failed');
  console.log('\n🔍 Possible Issues:');
  console.log('   1. SMTP Authentication is disabled for this account');
  console.log('   2. Password is incorrect');
  console.log('   3. Account requires App Password');
  console.log('   4. Organization security policy blocks SMTP');
  console.log('   5. Account requires Modern Authentication (OAuth2)');
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Verify password is correct by logging into Outlook web');
  console.log('   2. Contact IT admin to check if SMTP is enabled');
  console.log('   3. Try generating an App Password');
  console.log('   4. Or use a different email service (Gmail, SendGrid)');
}

testMicrosoftSMTP();
