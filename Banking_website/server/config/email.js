import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';
import dotenv from 'dotenv';
import { otpStore } from '../manager/auth.manager.js';

dotenv.config();

const apiInstance = new TransactionalEmailsApi();
apiInstance.setApiKey(0, process.env.BREVO_API_KEY);

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const deleteOTP = (email) => {
  otpStore.delete(email);
  console.log(`✅ OTP deleted for: ${email}`);
};

export const sendOTPEmail = async (email, otp, name) => {
  try {
    const sendSmtpEmail = new SendSmtpEmail();
    
    sendSmtpEmail.subject = 'Your OTP for Registration - BankingApp';
    sendSmtpEmail.sender = { 
      name: 'BankingApp', 
      email: 'subhashreenayak277@gmail.com'  
    };
    sendSmtpEmail.to = [{ email: email, name: name }];
    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            padding: 20px;
            margin: 0;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            max-width: 600px;
            margin: 0 auto;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            color: #4F46E5;
            margin-bottom: 30px;
          }
          .otp-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            text-align: center;
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            border-radius: 10px;
            margin: 30px 0;
          }
          .warning {
            background: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 40px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="header">🏦 BankingApp</h1>
          <h2>Hello ${name || 'User'},</h2>
          <p>Thank you for registering with BankingApp. Please use the One-Time Password (OTP) below to verify your email:</p>
          <div class="otp-box">${otp}</div>
          <div class="warning">
            <strong>⏰ Important:</strong> This OTP is valid for <strong>10 minutes only</strong>.
          </div>
          <p>If you didn't request this code, please ignore this email.</p>
          <p>For security reasons, never share this OTP with anyone, including BankingApp staff.</p>
          <div class="footer">
            <p><strong>BankingApp</strong></p>
            <p>© 2024 BankingApp. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ OTP email sent successfully via Brevo:', result);
    return { success: true, data: result };
    
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

export const sendWelcomeEmail = async (email, name) => {
  try {
    const sendSmtpEmail = new SendSmtpEmail();
    
    sendSmtpEmail.subject = 'Welcome to BankingApp! 🎉';
    sendSmtpEmail.sender = { 
      name: 'BankingApp', 
      email: 'subhashreenayak277@gmail.com' 
    };
    sendSmtpEmail.to = [{ email: email, name: name }];
    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px;">
          <h1 style="color: #4F46E5; text-align: center;">Welcome to BankingApp! 🎉</h1>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your account has been successfully created!</p>
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #4F46E5; margin-top: 0;">What you can do now:</h3>
            <ul style="line-height: 1.8;">
              <li>✅ View your account balance</li>
              <li>✅ Transfer money instantly</li>
              <li>✅ Track all transactions</li>
              <li>✅ Manage your profile</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 40px;">
            © 2024 BankingApp. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Welcome email sent successfully via Brevo:', result);
    return { success: true, data: result };
    
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

export const sendTransactionEmail = async (email, name, transaction) => {
  const { amount, type, recipient, timestamp, transactionId } = transaction;

  try {
    const sendSmtpEmail = new SendSmtpEmail();
    
    sendSmtpEmail.subject = `Transaction Alert: ${type} of ₹${amount}`;
    sendSmtpEmail.sender = { 
      name: 'BankingApp', 
      email: 'subhashreenayak277@gmail.com' 
    };
    sendSmtpEmail.to = [{ email: email, name: name }];
    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px;">
          <h1 style="color: #4F46E5; text-align: center;">Transaction Alert 🔔</h1>
          <p>Hi <strong>${name}</strong>,</p>
          <p>A transaction has been processed on your account:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 30px 0; border: 1px solid #ddd;">
            <tr style="background: #F3F4F6;">
              <td style="padding: 15px; border: 1px solid #ddd;"><strong>Transaction ID</strong></td>
              <td style="padding: 15px; border: 1px solid #ddd;">${transactionId}</td>
            </tr>
            <tr>
              <td style="padding: 15px; border: 1px solid #ddd;"><strong>Type</strong></td>
              <td style="padding: 15px; border: 1px solid #ddd;">${type}</td>
            </tr>
            <tr style="background: #F3F4F6;">
              <td style="padding: 15px; border: 1px solid #ddd;"><strong>Amount</strong></td>
              <td style="padding: 15px; border: 1px solid #ddd; font-size: 20px; color: #059669;"><strong>₹${amount}</strong></td>
            </tr>
            <tr>
              <td style="padding: 15px; border: 1px solid #ddd;"><strong>Recipient</strong></td>
              <td style="padding: 15px; border: 1px solid #ddd;">${recipient}</td>
            </tr>
            <tr style="background: #F3F4F6;">
              <td style="padding: 15px; border: 1px solid #ddd;"><strong>Date & Time</strong></td>
              <td style="padding: 15px; border: 1px solid #ddd;">${new Date(timestamp).toLocaleString()}</td>
            </tr>
          </table>
          <div style="background: #FEE2E2; border-left: 4px solid #EF4444; padding: 15px; margin: 30px 0; border-radius: 5px;">
            <p style="margin: 0; color: #991B1B;"><strong>⚠️ Security Alert:</strong> If you didn't authorize this transaction, please contact support immediately.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Transaction alert sent via Brevo:', result);
    return { success: true, data: result };
    
  } catch (error) {
    console.error('❌ Error sending transaction email:', error);
    return { success: false, error: error.message };
  }
};