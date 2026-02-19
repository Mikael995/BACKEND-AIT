import resend from "./resend"; 

// Shared Configuration
const clientUrl = process.env.CLIENT_URL || 'http://localhost:8080';
const adminEmail = process.env.ADMIN_EMAIL || 'no-reply@ivoriansintexas.com';

/**
 * 1. Sends a verification email to a newly registered user.
 */
export const sendAITVerificationEmail = async (email: string, firstName: string, token: string) => {
  const verifyUrl = `${clientUrl}/verify-email?token=${token}`;

  try {
    const result = await resend.emails.send({
      from: `AIT Verification <${adminEmail}>`,
      to: email,
      subject: "Verify your email – AIT 🇨🇮",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              .body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 0; margin: 0; }
              .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
              .header { padding: 40px 20px; text-align: center; background: #ffffff; }
              .logo { height: 80px; width: auto; }
              .content { padding: 0 40px 40px 40px; text-align: center; }
              .title { color: #111111; font-size: 26px; font-weight: 800; margin-bottom: 16px; }
              .text { color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 32px; }
              .button { 
                display: inline-block; 
                background: #16a34a; 
                color: #ffffff !important; 
                padding: 18px 36px; 
                border-radius: 16px; 
                font-weight: 700; 
                text-decoration: none; 
                font-size: 16px; 
              }
              .footer { padding: 32px 20px; text-align: center; background: #fcfcfc; border-top: 1px solid #f0f0f0; }
            </style>
          </head>
          <body class="body">
            <div class="container">
              <div class="header">
                <img src="https://ivoriansintexas.com/ait-logo.png" alt="AIT" class="logo" />
              </div>
              <div class="content">
                <h1 class="title">Akwaba, ${firstName}! 👋</h1>
                <p class="text">To get started and unlock community features, please verify your email address by clicking the button below.</p>
                <div style="margin: 30px 0;">
                  <a href="${verifyUrl}" class="button">Verify Email Address</a>
                </div>
                <p style="color: #999999; font-size: 12px;">
                  If the button above doesn't work, copy and paste this link into your browser:<br>
                  <a href="${verifyUrl}" style="color: #16a34a;">${verifyUrl}</a>
                </p>
              </div>
              <div class="footer">
                <p style="color: #cccccc; font-size: 11px;">&copy; 2026 Association des Ivoiriens au Texas. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Verification Email Result:", result);
    return result;
  } catch (error) {
    console.error("Verification Mailer Error:", error);
    throw error;
  }
};

/**
 * 2. Password Reset Email (Critical for Admin Controller)
 */
export const sendAITPasswordResetEmail = async (email: string, token: string) => {
  const resetUrl = `${clientUrl}/reset-password?token=${token}`;

  try {
    const result = await resend.emails.send({
      from: `AIT Security <${adminEmail}>`,
      to: email,
      subject: "Reset your password – AIT 🇨🇮",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              .body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 0; margin: 0; }
              .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
              .header { padding: 40px 20px; text-align: center; background: #ffffff; }
              .logo { height: 80px; width: auto; }
              .content { padding: 0 40px 40px 40px; text-align: center; }
              .title { color: #111111; font-size: 26px; font-weight: 800; margin-bottom: 16px; }
              .text { color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 32px; }
              .button { 
                display: inline-block; 
                background: #ea580c; 
                color: #ffffff !important; 
                padding: 18px 36px; 
                border-radius: 16px; 
                font-weight: 700; 
                text-decoration: none; 
                font-size: 16px; 
              }
              .footer { padding: 32px 20px; text-align: center; background: #fcfcfc; border-top: 1px solid #f0f0f0; }
            </style>
          </head>
          <body class="body">
            <div class="container">
              <div class="header">
                <img src="https://ivoriansintexas.com/ait-logo.png" alt="AIT" class="logo" />
              </div>
              <div class="content">
                <h1 class="title">Reset Password 🔒</h1>
                <p class="text">We received a request to reset your password. If you didn't make this request, you can safely ignore this email. Otherwise, click the button below.</p>
                <div style="margin: 30px 0;">
                  <a href="${resetUrl}" class="button">Reset My Password</a>
                </div>
                <p style="color: #999999; font-size: 12px;">
                  This link will expire in 1 hour.<br>
                  <a href="${resetUrl}" style="color: #ea580c;">${resetUrl}</a>
                </p>
              </div>
              <div class="footer">
                <p style="color: #cccccc; font-size: 11px;">&copy; 2026 Association des Ivoiriens au Texas. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Password Reset Result:", result);
    return result;
  } catch (error) {
    console.error("Password Reset Mailer Error:", error);
    throw error;
  }
};