import os

test_base = "/home/sheheryar-sohail/Downloads/Property-Management-System-test"

# 1. Update apps/api/src/mailer/mailer.service.ts
mailer_path = os.path.join(test_base, "apps/api/src/mailer/mailer.service.ts")
mailer_content = """import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS?.trim();

    if (user && pass) {
      try {
        if (host === 'smtp.gmail.com' || user.endsWith('@gmail.com')) {
          this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user,
              pass: pass.replace(/\\s+/g, ''), // strip spaces from Google App Password
            },
          });
          this.logger.log(`SMTP transporter initialized using Gmail service for ${user}`);
        } else {
          this.transporter = nodemailer.createTransport({
            host: host || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT ?? 587),
            secure: process.env.SMTP_SECURE === '1',
            auth: {
              user,
              pass,
            },
          });
          this.logger.log(`SMTP transporter initialized for ${user} on ${host}`);
        }
      } catch (err: any) {
        this.logger.warn(`Failed to initialize SMTP transporter: ${err?.message}`);
        this.transporter = null;
      }
    } else {
      this.logger.warn('SMTP credentials not fully set (SMTP_PASS is empty). MailerService running in log/mock mode.');
    }
  }

  async send(options: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: { filename: string; content: Buffer; contentType?: string }[];
  }) {
    const from = process.env.SMTP_FROM ?? 'Property Suite <no-reply@ssestateandmarketing.com>';

    if (!this.transporter || !process.env.SMTP_PASS?.trim()) {
      this.logger.log(`[MOCK/LOG EMAIL DISPATCH] To: ${options.to} | Subject: ${options.subject}`);
      return { ok: true, mocked: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from,
        ...options,
      });
      this.logger.log(`Email successfully sent to ${options.to} (ID: ${info.messageId})`);
      return { ok: true, info, mocked: false };
    } catch (err: any) {
      this.logger.error(`Error sending email to ${options.to}: ${err?.message || err}`);
      return { ok: false, error: err?.message || String(err), mocked: true };
    }
  }

  async sendResetCodeEmail(to: string, code: string, name?: string) {
    const recipientName = name || 'User';
    const subject = `Your Password Reset Code: ${code} - Property Suite`;
    const text = `Hello ${recipientName},\\n\\nYour password reset verification code is: ${code}\\n\\nThis code will expire in 10 minutes. If you did not request this, please ignore this email.\\n\\nRegards,\\nProperty Suite Security Team`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset Code</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; background-color: #f1f5f9; color: #1e293b;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 32px 32px 20px 32px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Property Suite</h1>
              <p style="color: #94a3b8; font-size: 13px; margin: 6px 0 0 0;">Account Verification & Security</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Password Reset Request</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-top: 0;">
                Hello <strong>${recipientName}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                We received a request to reset your password. Use the 6-digit verification code below to authorize your password change:
              </p>
              
              <div style="margin: 28px 0; text-align: center;">
                <div style="display: inline-block; background-color: #f8fafc; border: 2px dashed #0284c7; border-radius: 12px; padding: 16px 32px;">
                  <span style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0284c7;">${code}</span>
                </div>
                <p style="font-size: 12px; color: #64748b; margin-top: 10px; margin-bottom: 0;">
                  ⏱ This code is valid for <strong>10 minutes</strong> only.
                </p>
              </div>

              <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 4px; margin-top: 24px;">
                <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 0;">
                  <strong>Security Reminder:</strong> If you did not make this request, you can safely ignore this email. Your current password remains unchanged.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                © ${new Date().getFullYear()} Property Suite. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.send({
      to,
      subject,
      text,
      html,
    });
  }

  async sendPdf(to: string, subject: string, bodyText: string, filename: string, pdf: Buffer) {
    return this.send({
      to,
      subject,
      text: bodyText,
      html: `<p>${bodyText}</p>`,
      attachments: [{ filename, content: pdf, contentType: 'application/pdf' }],
    });
  }

  async verify(): Promise<{ ok: boolean; error?: string }> {
    if (!this.transporter) return { ok: false, error: 'Transporter not configured' };
    try {
      await this.transporter.verify();
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || String(e) };
    }
  }
}
"""
with open(mailer_path, "w", encoding="utf-8") as f:
    f.write(mailer_content)
print("Updated mailer.service.ts")

# 2. Update apps/api/src/auth/auth.service.ts to return code in test mode / when mock
auth_service_path = os.path.join(test_base, "apps/api/src/auth/auth.service.ts")
with open(auth_service_path, "r", encoding="utf-8") as f:
    auth_service_text = f.read()

old_return = """    // Dispatch email
    await this.mailerService.sendResetCodeEmail(normalizedEmail, code, user.name);

    return {
      success: true,
      message: 'A 6-digit verification code has been sent to your email address.',
      email: normalizedEmail,
    };"""

new_return = """    // Dispatch email
    const emailResult = await this.mailerService.sendResetCodeEmail(normalizedEmail, code, user.name);

    return {
      success: true,
      message: emailResult.mocked
        ? 'A 6-digit verification code has been generated. (SMTP credentials pending in .env).'
        : 'A 6-digit verification code has been sent to your email address.',
      email: normalizedEmail,
      // Provide code in response if email is mocked or in test mode so user can proceed
      ...(emailResult.mocked || !process.env.SMTP_PASS ? { code } : {}),
    };"""

if old_return in auth_service_text:
    auth_service_text = auth_service_text.replace(old_return, new_return)
    with open(auth_service_path, "w", encoding="utf-8") as f:
        f.write(auth_service_text)
    print("Updated auth.service.ts")
else:
    print("Pattern not found in auth.service.ts, will check manually")

# 3. Update apps/web/src/app/login/page.tsx
# Replace placeholder="e.g. sheheryarsohail3@gmail.com" with placeholder="you@company.com"
# And handle devCode display if provided
login_page_path = os.path.join(test_base, "apps/web/src/app/login/page.tsx")
with open(login_page_path, "r", encoding="utf-8") as f:
    login_page_text = f.read()

# Replace placeholder
login_page_text = login_page_text.replace('placeholder="e.g. sheheryarsohail3@gmail.com"', 'placeholder="you@company.com"')

# Add devCode state if not present
if "const [devCode, setDevCode] = useState('');" not in login_page_text:
    login_page_text = login_page_text.replace(
        "const [resendCooldown, setResendCooldown] = useState(0);",
        "const [resendCooldown, setResendCooldown] = useState(0);\n  const [devCode, setDevCode] = useState('');"
    )

# Save devCode when sending reset code
old_send_success = """      toast.success(data?.message || 'Verification code sent to your email!');
      setView('forgot-verify');
      setResendCooldown(60);"""

new_send_success = """      toast.success(data?.message || 'Verification code sent to your email!');
      if (data?.code) {
        setDevCode(data.code);
        setResetCode(data.code);
      }
      setView('forgot-verify');
      setResendCooldown(60);"""

if old_send_success in login_page_text:
    login_page_text = login_page_text.replace(old_send_success, new_send_success)

# In forgot-verify view, show banner if devCode is present
old_verify_intro = """                <p className="text-sm text-slate-500">
                  We've sent a verification code to <span className="font-semibold text-slate-800">{resetEmail}</span>. Enter it below to authorize changing your password:
                </p>
              </div>"""

new_verify_intro = """                <p className="text-sm text-slate-500">
                  We've sent a verification code to <span className="font-semibold text-slate-800">{resetEmail}</span>. Enter it below to authorize changing your password:
                </p>
                {devCode && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800 flex items-center justify-between">
                    <span>Test PMS Code: <strong className="font-mono text-sm tracking-wider">{devCode}</strong></span>
                    <button
                      type="button"
                      onClick={() => setResetCode(devCode)}
                      className="text-primary font-bold hover:underline"
                    >
                      Fill Code
                    </button>
                  </div>
                )}
              </div>"""

if old_verify_intro in login_page_text:
    login_page_text = login_page_text.replace(old_verify_intro, new_verify_intro)

with open(login_page_path, "w", encoding="utf-8") as f:
    f.write(login_page_text)
print("Updated apps/web/src/app/login/page.tsx with generic placeholder and test code helper")
