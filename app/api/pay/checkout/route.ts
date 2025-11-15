import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@/lib/email";
import { z } from "zod";

const checkoutSchema = z.object({
  plan: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    period: z.string(),
    features: z.array(z.string()),
  }),
  paymentMethod: z.string(),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  transactionId: z.string().min(1, "Transaction ID is required"),
  amount: z.string().min(1, "Amount is required"),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = checkoutSchema.parse(body);

    // Send email to admin
    const adminEmail = process.env.ADMIN_EMAIL || "admin@scorefusion.com";

    const subject = `New VIP Payment Submission - ${validatedData.plan.name}`;

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
                  <td style="background: linear-gradient(135deg, #FFA500 0%, #FFA500 100%); padding: 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      New VIP Payment
                    </h1>
                    <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                      Awaiting Verification
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 24px; color: #0f172a; font-size: 24px; font-weight: 600;">
                      Payment Details Submitted
                    </h2>

                    <!-- Plan Details -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 20px; background-color: #f1f5f9; border-radius: 8px;">
                          <h3 style="margin: 0 0 12px; color: #0f172a; font-size: 18px; font-weight: 600;">
                            Plan: ${validatedData.plan.name}
                          </h3>
                          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #475569;">Price:</span>
                            <span style="color: #0f172a; font-weight: 600;">€${
                              validatedData.plan.price
                            }</span>
                          </div>
                          <div style="display: flex; justify-content: space-between;">
                            <span style="color: #475569;">Period:</span>
                            <span style="color: #0f172a; font-weight: 600;">${
                              validatedData.plan.period
                            }</span>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Customer Details -->
                    <h3 style="margin: 24px 0 16px; color: #0f172a; font-size: 18px; font-weight: 600;">
                      Customer Information
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                          <strong>Full Name:</strong> ${validatedData.fullName}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                          <strong>Email:</strong> ${validatedData.email}
                        </td>
                      </tr>
                      ${
                        validatedData.phone
                          ? `
                      <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                          <strong>Phone:</strong> ${validatedData.phone}
                        </td>
                      </tr>
                      `
                          : ""
                      }
                    </table>

                    <!-- Payment Details -->
                    <h3 style="margin: 24px 0 16px; color: #0f172a; font-size: 18px; font-weight: 600;">
                      Payment Information
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                          <strong>Payment Method:</strong> ${validatedData.paymentMethod
                            .replace("_", " ")
                            .toUpperCase()}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                          <strong>Transaction ID:</strong> ${
                            validatedData.transactionId
                          }
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                          <strong>Amount Paid:</strong> €${validatedData.amount}
                        </td>
                      </tr>
                      ${
                        validatedData.notes
                          ? `
                      <tr>
                        <td style="padding: 12px;">
                          <strong>Notes:</strong><br>${validatedData.notes}
                        </td>
                      </tr>
                      `
                          : ""
                      }
                    </table>

                    <!-- Action Buttons -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
                      <tr>
                        <td align="center" style="padding: 8px 0;">
                          <a href="mailto:${
                            validatedData.email
                          }?subject=VIP Payment Verified - ${
      validatedData.plan.name
    }&body=Dear ${
      validatedData.fullName
    },%0A%0AYour VIP payment has been verified and your access is now active.%0A%0APlan: ${
      validatedData.plan.name
    }%0AAmount: €${validatedData.amount}%0ATransaction ID: ${
      validatedData.transactionId
    }%0A%0AYou can now access the VIP section at https://getscorefusion.com/vip%0A%0ABest regards,%0AScore Fusion Team"
                             style="display: inline-block; padding: 12px 24px; margin: 0 8px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                            ✓ Approve Payment
                          </a>
                          <a href="mailto:${
                            validatedData.email
                          }?subject=VIP Payment Issue - ${
      validatedData.plan.name
    }&body=Dear ${
      validatedData.fullName
    },%0A%0AWe noticed an issue with your VIP payment submission.%0A%0APlease check your payment details and try again, or contact us for assistance.%0A%0ATransaction ID: ${
      validatedData.transactionId
    }%0A%0ABest regards,%0AScore Fusion Team"
                             style="display: inline-block; padding: 12px 24px; margin: 0 8px; background-color: #ef4444; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                            ✗ Reject Payment
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Features List -->
                    <h3 style="margin: 32px 0 16px; color: #0f172a; font-size: 18px; font-weight: 600;">
                      Plan Features
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; color: #475569;">
                      ${validatedData.plan.features
                        .map(
                          (feature) =>
                            `<li style="margin-bottom: 4px;">${feature}</li>`
                        )
                        .join("")}
                    </ul>

                    <p style="margin: 32px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                      <strong>Next Steps:</strong><br>
                      1. Verify the payment details with the customer's bank/financial institution<br>
                      2. If approved, send the approval email and activate VIP access<br>
                      3. If rejected, send the rejection email with instructions
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 32px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">
                      This is an automated notification from Score Fusion
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      Submitted on ${new Date().toLocaleString()}
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

    await EmailService.sendEmail({
      to: adminEmail,
      subject,
      html,
    });

    // Send confirmation email to customer
    const customerSubject = "VIP Payment Submitted - Awaiting Verification";
    const customerHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${customerSubject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      Payment Submitted
                    </h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px; color: #0f172a; font-size: 24px; font-weight: 600;">
                      Thank you, ${validatedData.fullName}!
                    </h2>

                    <p style="margin: 0 0 16px; color: #475569; font-size: 16px; line-height: 1.6;">
                      Your VIP payment details have been successfully submitted. Our admin team will verify your payment and activate your VIP access.
                    </p>

                    <!-- Plan Details -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                      <tr>
                        <td style="padding: 20px; background-color: #f1f5f9; border-radius: 8px;">
                          <h3 style="margin: 0 0 12px; color: #0f172a; font-size: 18px; font-weight: 600;">
                            ${validatedData.plan.name}
                          </h3>
                          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #475569;">Amount Paid:</span>
                            <span style="color: #0f172a; font-weight: 600;">€${
                              validatedData.amount
                            }</span>
                          </div>
                          <div style="display: flex; justify-content: space-between;">
                            <span style="color: #475569;">Transaction ID:</span>
                            <span style="color: #0f172a; font-weight: 600;">${
                              validatedData.transactionId
                            }</span>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- What happens next -->
                    <h3 style="margin: 24px 0 16px; color: #0f172a; font-size: 18px; font-weight: 600;">
                      What happens next?
                    </h3>
                    <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                      <ol style="margin: 0; padding-left: 20px; color: #92400e; line-height: 1.6;">
                        <li style="margin-bottom: 8px;">Our admin team will verify your payment (usually within 24 hours)</li>
                        <li style="margin-bottom: 8px;">You'll receive a confirmation email once approved</li>
                        <li style="margin-bottom: 8px;">VIP access will be activated automatically</li>
                        <li style="margin-bottom: 0;">You can then access exclusive tips and features</li>
                      </ol>
                    </div>

                    <!-- Contact Info -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                      <tr>
                        <td style="padding: 16px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                          <h4 style="margin: 0 0 8px; color: #065f46; font-size: 16px; font-weight: 600;">
                            Need help?
                          </h4>
                          <p style="margin: 0; color: #047857; font-size: 14px; line-height: 1.5;">
                            If you have any questions or haven't heard back within 24 hours, contact us:<br>
                            Email: Scorefusionn@gmail.com<br>
                            Telegram: @ScoreFusionSupport
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 32px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">
                      © ${new Date().getFullYear()} Score Fusion. All rights reserved.
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

    await EmailService.sendEmail({
      to: validatedData.email,
      subject: customerSubject,
      html: customerHtml,
    });

    return NextResponse.json({
      success: true,
      message:
        "Payment details submitted successfully. Check your email for confirmation.",
    });
  } catch (error) {
    console.error("Checkout submission error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit payment details. Please try again.",
      },
      { status: 500 }
    );
  }
}

// Server-Sent Events endpoint for real-time analytics
export async function GET() {
  // TODO: Verify admin auth

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection event
      const send = (data: Record<string, unknown>) => {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      send({
        type: "connected",
        ts: Date.now(),
      });

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        send({
          type: "heartbeat",
          ts: Date.now(),
        });
      }, 30000);

      // Mock analytics events (in production, subscribe to Redis pub/sub)
      const analyticsInterval = setInterval(() => {
        send({
          type: "analytics",
          data: {
            activeUsers: Math.floor(Math.random() * 100),
            newSignups: Math.floor(Math.random() * 10),
            activeTips: Math.floor(Math.random() * 50),
            revenue: Math.floor(Math.random() * 1000),
          },
          ts: Date.now(),
        });
      }, 5000);

      // Cleanup on close
      return () => {
        clearInterval(heartbeat);
        clearInterval(analyticsInterval);
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
