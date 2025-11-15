import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "noreply@getscorefusion.com";
const FROM_NAME = "Score Fusion";

// Primary brand color
const PRIMARY_COLOR = "#FFA500"; // orange
const DARK_BG = "#0f172a"; // slate-900

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  static async sendEmail({ to, subject, html }: EmailOptions) {
    try {
      const { data, error } = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject,
        html,
      });

      if (error) {
        console.error("Resend error:", error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error("Email service error:", error);
      throw error;
    }
  }

  // Welcome email for new signups
  static async sendWelcomeEmail(to: string, displayName: string) {
    const subject = `Welcome to ${FROM_NAME}! 🎉`;
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #059669 100%); padding: 40px 40px 60px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      ${FROM_NAME}
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px; color: ${DARK_BG}; font-size: 24px; font-weight: 600;">
                      Welcome aboard, ${displayName}! 🎉
                    </h2>
                    
                    <p style="margin: 0 0 16px; color: #475569; font-size: 16px; line-height: 1.6;">
                      We're thrilled to have you join the Score Fusion community! You've just taken the first step towards smarter sports betting insights and real-time match updates.
                    </p>
                    
                    <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                      Here's what you can do now:
                    </p>
                    
                    <!-- Features List -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 16px; background-color: #f1f5f9; border-radius: 8px; margin-bottom: 12px;">
                          <div style="display: flex; align-items: start;">
                            <div style="flex-shrink: 0; width: 24px; height: 24px; background-color: ${PRIMARY_COLOR}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                              <span style="color: white; font-size: 14px; font-weight: bold;">✓</span>
                            </div>
                            <div>
                              <h3 style="margin: 0 0 4px; color: ${DARK_BG}; font-size: 16px; font-weight: 600;">Access Expert Tips</h3>
                              <p style="margin: 0; color: #64748b; font-size: 14px;">Get professional betting insights and predictions</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr><td style="height: 12px;"></td></tr>
                      <tr>
                        <td style="padding: 16px; background-color: #f1f5f9; border-radius: 8px;">
                          <div style="display: flex; align-items: start;">
                            <div style="flex-shrink: 0; width: 24px; height: 24px; background-color: ${PRIMARY_COLOR}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                              <span style="color: white; font-size: 14px; font-weight: bold;">✓</span>
                            </div>
                            <div>
                              <h3 style="margin: 0 0 4px; color: ${DARK_BG}; font-size: 16px; font-weight: 600;">Live Score Updates</h3>
                              <p style="margin: 0; color: #64748b; font-size: 14px;">Track matches in real-time across multiple sports</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr><td style="height: 12px;"></td></tr>
                      <tr>
                        <td style="padding: 16px; background-color: #f1f5f9; border-radius: 8px;">
                          <div style="display: flex; align-items: start;">
                            <div style="flex-shrink: 0; width: 24px; height: 24px; background-color: ${PRIMARY_COLOR}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                              <span style="color: white; font-size: 14px; font-weight: bold;">✓</span>
                            </div>
                            <div>
                              <h3 style="margin: 0 0 4px; color: ${DARK_BG}; font-size: 16px; font-weight: 600;">Earn Rewards</h3>
                              <p style="margin: 0; color: #64748b; font-size: 14px;">Build your wallet through our referral program</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 8px 0;">
                          <a href="${
                            process.env.NEXT_PUBLIC_APP_URL ||
                            "https://getscorefusion.com"
                          }/dashboard" 
                             style="display: inline-block; padding: 14px 32px; background-color: ${PRIMARY_COLOR}; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; transition: background-color 0.2s;">
                            Get Started
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 24px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                      Need help? We're here for you! Reply to this email or visit our 
                      <a href="${
                        process.env.NEXT_PUBLIC_APP_URL ||
                        "https://getscorefusion.com"
                      }/help" style="color: ${PRIMARY_COLOR}; text-decoration: none;">Help Center</a>.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 32px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">
                      © ${new Date().getFullYear()} ${FROM_NAME}. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      <a href="${
                        process.env.NEXT_PUBLIC_APP_URL ||
                        "https://getscorefusion.com"
                      }/privacy" style="color: #64748b; text-decoration: none; margin: 0 8px;">Privacy Policy</a> | 
                      <a href="${
                        process.env.NEXT_PUBLIC_APP_URL ||
                        "https://getscorefusion.com"
                      }/terms" style="color: #64748b; text-decoration: none; margin: 0 8px;">Terms of Service</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendEmail({ to, subject, html });
  }

  // Password reset email with code
  static async sendPasswordResetEmail(
    to: string,
    displayName: string,
    resetCode: string
  ) {
    const subject = "Reset Your Password";
    const resetLink = `${
      process.env.NEXT_PUBLIC_APP_URL || "https://getscorefusion.com"
    }/reset-password?token=${resetCode}`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #059669 100%); padding: 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      ${FROM_NAME}
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px; color: ${DARK_BG}; font-size: 24px; font-weight: 600;">
                      Reset Your Password
                    </h2>
                    
                    <p style="margin: 0 0 16px; color: #475569; font-size: 16px; line-height: 1.6;">
                      Hi ${displayName},
                    </p>
                    
                    <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                      We received a request to reset your password. Use the code below to continue, or click the button to reset your password directly.
                    </p>
                    
                    <!-- Reset Code Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                      <tr>
                        <td align="center" style="padding: 24px; background-color: #f1f5f9; border-radius: 8px; border: 2px dashed ${PRIMARY_COLOR};">
                          <p style="margin: 0 0 8px; color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                            Your Reset Code
                          </p>
                          <p style="margin: 0; color: ${DARK_BG}; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                            ${resetCode}
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0 0 24px; color: #475569; font-size: 14px; line-height: 1.6; text-align: center;">
                      Or use the button below:
                    </p>
                    
                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                      <tr>
                        <td align="center">
                          <a href="${resetLink}" 
                             style="display: inline-block; padding: 14px 32px; background-color: ${PRIMARY_COLOR}; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Warning Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                      <tr>
                        <td style="padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                          <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                            <strong>Important:</strong> This code will expire in 1 hour for security reasons.
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0 0 8px; color: #64748b; font-size: 14px; line-height: 1.6;">
                      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                    </p>
                    
                    <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                      For security, never share this code with anyone.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 32px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">
                      © ${new Date().getFullYear()} ${FROM_NAME}. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      <a href="${
                        process.env.NEXT_PUBLIC_APP_URL ||
                        "https://getscorefusion.com"
                      }/privacy" style="color: #64748b; text-decoration: none; margin: 0 8px;">Privacy Policy</a> | 
                      <a href="${
                        process.env.NEXT_PUBLIC_APP_URL ||
                        "https://getscorefusion.com"
                      }/terms" style="color: #64748b; text-decoration: none; margin: 0 8px;">Terms of Service</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendEmail({ to, subject, html });
  }

  // Password change confirmation email
  static async sendPasswordChangeConfirmation(to: string, displayName: string) {
    const subject = "Your Password Has Been Changed";

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #059669 100%); padding: 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      ${FROM_NAME}
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                      <div style="display: inline-block; width: 64px; height: 64px; background-color: #d1fae5; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 32px;">✓</span>
                      </div>
                    </div>
                    
                    <h2 style="margin: 0 0 20px; color: ${DARK_BG}; font-size: 24px; font-weight: 600; text-align: center;">
                      Password Successfully Changed
                    </h2>
                    
                    <p style="margin: 0 0 16px; color: #475569; font-size: 16px; line-height: 1.6;">
                      Hi ${displayName},
                    </p>
                    
                    <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                      Your password has been successfully changed. You can continue to use your account with your new password.
                    </p>
                    
                    <!-- Security Notice -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                          <p style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: 600;">
                            Didn't make this change?
                          </p>
                          <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                            If you didn't change your password, please contact our support team immediately to secure your account.
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${
                            process.env.NEXT_PUBLIC_APP_URL ||
                            "https://getscorefusion.com"
                          }/dashboard" 
                             style="display: inline-block; padding: 14px 32px; background-color: ${PRIMARY_COLOR}; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                            Go to Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 32px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">
                      © ${new Date().getFullYear()} ${FROM_NAME}. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      <a href="${
                        process.env.NEXT_PUBLIC_APP_URL ||
                        "https://getscorefusion.com"
                      }/privacy" style="color: #64748b; text-decoration: none; margin: 0 8px;">Privacy Policy</a> | 
                      <a href="${
                        process.env.NEXT_PUBLIC_APP_URL ||
                        "https://getscorefusion.com"
                      }/terms" style="color: #64748b; text-decoration: none; margin: 0 8px;">Terms of Service</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendEmail({ to, subject, html });
  }

  // Password reset confirmation email
  static async sendPasswordResetConfirmation(to: string, displayName: string) {
    const subject = "Your Password Has Been Reset";

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #059669 100%); padding: 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      ${FROM_NAME}
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                      <div style="display: inline-block; width: 64px; height: 64px; background-color: #d1fae5; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 32px;">✓</span>
                      </div>
                    </div>
                    
                    <h2 style="margin: 0 0 20px; color: ${DARK_BG}; font-size: 24px; font-weight: 600; text-align: center;">
                      Password Successfully Reset
                    </h2>
                    
                    <p style="margin: 0 0 16px; color: #475569; font-size: 16px; line-height: 1.6;">
                      Hi ${displayName},
                    </p>
                    
                    <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                      Your password has been successfully reset. You can now log in to your account using your new password.
                    </p>
                    
                    <!-- Security Notice -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                          <p style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: 600;">
                            Didn't make this change?
                          </p>
                          <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                            If you didn't reset your password, please contact our support team immediately to secure your account.
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${
                            process.env.NEXT_PUBLIC_APP_URL ||
                            "https://getscorefusion.com"
                          }/login" 
                             style="display: inline-block; padding: 14px 32px; background-color: ${PRIMARY_COLOR}; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                            Log In to Your Account
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 32px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">
                      © ${new Date().getFullYear()} ${FROM_NAME}. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      <a href="${
                        process.env.NEXT_PUBLIC_APP_URL ||
                        "https://getscorefusion.com"
                      }/privacy" style="color: #64748b; text-decoration: none; margin: 0 8px;">Privacy Policy</a> | 
                      <a href="${
                        process.env.NEXT_PUBLIC_APP_URL ||
                        "https://getscorefusion.com"
                      }/terms" style="color: #64748b; text-decoration: none; margin: 0 8px;">Terms of Service</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendEmail({ to, subject, html });
  }

  // VIP Token email
  static async sendVIPTokenEmail(
    to: string,
    displayName: string,
    tokens: string[],
    expirationDays: number,
    reason: string
  ) {
    const subject = "Your VIP Access Tokens Have Arrived! 🌟";
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expirationDays);

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #eab308 0%, #f59e0b 100%); padding: 40px; text-align: center;">
                    <div style="display: inline-block; width: 64px; height: 64px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                      <span style="font-size: 32px;">⭐</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      VIP Access Granted
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px; color: ${DARK_BG}; font-size: 24px; font-weight: 600;">
                      Hi ${displayName}! 🎉
                    </h2>
                    
                    <p style="margin: 0 0 16px; color: #475569; font-size: 16px; line-height: 1.6;">
                      Great news! You've been granted VIP access to exclusive premium content on Score Fusion.
                    </p>
                    
                    <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                      <strong>Reason:</strong> ${reason}
                    </p>
                    
                    <!-- Token Info Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; border-left: 4px solid #eab308;">
                          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <span style="color: #92400e; font-size: 14px; font-weight: 600; text-transform: uppercase;">Valid For</span>
                            <span style="color: #92400e; font-size: 16px; font-weight: 700;">${expirationDays} Days</span>
                          </div>
                          <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #92400e; font-size: 14px; font-weight: 600; text-transform: uppercase;">Expires On</span>
                            <span style="color: #92400e; font-size: 16px; font-weight: 700;">${expirationDate.toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}</span>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <h3 style="margin: 0 0 16px; color: ${DARK_BG}; font-size: 18px; font-weight: 600;">
                      Your VIP Access ${tokens.length > 1 ? "PINs" : "PIN"}:
                    </h3>
                    
                    ${tokens
                      .map(
                        (token, index) => `
                      <!-- Token Code Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                        <tr>
                          <td style="padding: 20px; background-color: #f1f5f9; border-radius: 8px; border: 2px solid #eab308;">
                            ${
                              tokens.length > 1
                                ? `<p style="margin: 0 0 8px; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">PIN ${
                                    index + 1
                                  }</p>`
                                : ""
                            }
                            <p style="margin: 0; color: ${DARK_BG}; font-size: 28px; font-weight: 700; letter-spacing: 4px; font-family: 'Courier New', monospace; text-align: center;">
                              ${token}
                            </p>
                          </td>
                        </tr>
                      </table>
                    `
                      )
                      .join("")}
                    
                    <!-- How to Use -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 20px; background-color: #f0fdf4; border-left: 4px solid ${PRIMARY_COLOR}; border-radius: 4px;">
                          <h3 style="margin: 0 0 12px; color: #065f46; font-size: 16px; font-weight: 600;">
                            How to Use Your ${
                              tokens.length > 1 ? "PINs" : "PIN"
                            }:
                          </h3>
                          <ol style="margin: 0; padding-left: 20px; color: #047857; font-size: 14px; line-height: 1.6;">
                            <li style="margin-bottom: 8px;">Navigate to the VIP section on Score Fusion</li>
                            <li style="margin-bottom: 8px;">Enter ${
                              tokens.length > 1
                                ? "one of your PINs"
                                : "your PIN"
                            } when prompted</li>
                            <li style="margin-bottom: 8px;">Enjoy exclusive premium tips and insights!</li>
                            ${
                              tokens.length > 1
                                ? '<li style="margin-bottom: 0;">Each PIN can be used once</li>'
                                : ""
                            }
                          </ol>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${
                            process.env.NEXT_PUBLIC_APP_URL ||
                            "https://getscorefusion.com"
                          }/vip" 
                             style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #eab308 0%, #f59e0b 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                            Access VIP Content Now
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 24px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                      <strong>Important:</strong> Keep ${
                        tokens.length > 1 ? "these PINs" : "this PIN"
                      } secure. ${
      tokens.length > 1 ? "They are" : "It is"
    } your personal access code${
      tokens.length > 1 ? "s" : ""
    } to premium content.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 32px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">
                      © ${new Date().getFullYear()} ${FROM_NAME}. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      <a href="${
                        process.env.NEXT_PUBLIC_APP_URL ||
                        "https://getscorefusion.com"
                      }/privacy" style="color: #64748b; text-decoration: none; margin: 0 8px;">Privacy Policy</a> | 
                      <a href="${
                        process.env.NEXT_PUBLIC_APP_URL ||
                        "https://getscorefusion.com"
                      }/terms" style="color: #64748b; text-decoration: none; margin: 0 8px;">Terms of Service</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendEmail({ to, subject, html });
  }
}
