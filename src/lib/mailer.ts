// src/lib/mailer.ts

// src/lib/mailer.ts
import resend from "./resend"; 

/**
 * Sends a verification email to a newly registered user or upon resend request.
 * Uses environment variables for the sender address and client redirection URL.
 */
export const sendAITVerificationEmail = async (email: string, firstName: string, token: string) => {
  // 1. Setup variables from environment
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:8080';
  const adminEmail = process.env.ADMIN_EMAIL || 'no-reply@ivoriansintexas.com';
  
  // Create the full verification link
  const verifyUrl = `${clientUrl}/verify-email?token=${token}`;

  try {
    const result = await resend.emails.send({
      // 2. Use the ADMIN_EMAIL from your .env
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

    // Logging the full result to help debug delivery issues
    console.log("Resend API Response:", result);
    
    if (result.error) {
      console.error("Resend delivery error:", result.error);
    } else {
      console.log("Email sent successfully. ID:", result.data?.id);
    }

    return result;
  } catch (error) {
    console.error("Mailer Error (Catch Block):", error);
    throw error;
  }
};