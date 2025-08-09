// lib/email/templates/verification.ts
import { EmailTemplate } from '../emailService'

export function verificationTemplate(
  otp: string,
  userName?: string
): EmailTemplate {
  const subject = 'Verify Your Email Address'

  const text = `
Hi${userName ? ` ${userName}` : ''},

Your verification code is: ${otp}

This code will expire in 15 minutes. Please use it to verify your email address.

If you didn't request this verification, please ignore this email.

Best regards,
DZNS - Digii Vietnam
  `.trim()

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e9ecef; }
        .otp-code { 
            background: #007bff; 
            color: white; 
            padding: 15px 25px; 
            font-size: 24px; 
            font-weight: bold; 
            text-align: center; 
            border-radius: 6px; 
            letter-spacing: 3px;
            margin: 20px 0;
        }
        .footer { background: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #6c757d; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Email Verification</h1>
        </div>
        <div class="content">
            <p>Hi${userName ? ` <strong>${userName}</strong>` : ''},</p>
            <p>Thank you for signing up! To complete your registration, please verify your email address using the code below:</p>
            
            <div class="otp-code">${otp}</div>
            
            <div class="warning">
                <p><strong>Important:</strong> This verification code will expire in <strong>15 minutes</strong>.</p>
            </div>
            
            <p>If you didn't create an account with us, please ignore this email.</p>
            
            <p>Best regards,<br>DZNS - Digii Vietnam</p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
        </div>
    </div>
</body>
</html>
  `

  return { subject, text, html }
}
