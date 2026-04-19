import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

MAIL_USERNAME = os.getenv("MAIL_USERNAME", "fwtapp860@gmail.com")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "gnus ahfu tmfm bfon")
MAIL_FROM     = os.getenv("MAIL_USERNAME", "fwtapp860@gmail.com")
FRONTEND_URL  = os.getenv("FRONTEND_URL", "http://localhost:3000")


def send_reset_email(to_email: str, token: str):
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"

    # ── HTML Email Template ──
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f0eeff; margin: 0; padding: 0; }}
        .wrapper {{ max-width: 520px; margin: 40px auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 32px rgba(124,58,237,0.12); }}
        .header {{ background: linear-gradient(90deg, #7c3aed, #ec4899); padding: 36px 40px; text-align: center; }}
        .header h1 {{ color: white; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px; }}
        .header p {{ color: rgba(255,255,255,0.80); margin: 6px 0 0; font-size: 13px; }}
        .body {{ padding: 36px 40px; }}
        .body h2 {{ color: #1a1040; font-size: 20px; margin: 0 0 12px; }}
        .body p {{ color: #64748b; font-size: 14px; line-height: 1.7; margin: 0 0 24px; }}
        .btn {{ display: block; width: fit-content; margin: 0 auto 24px; background: linear-gradient(90deg, #7c3aed, #ec4899); color: white; text-decoration: none; padding: 14px 36px; border-radius: 999px; font-weight: 700; font-size: 15px; }}
        .note {{ background: #f6f4ff; border: 1px solid rgba(124,58,237,0.15); border-radius: 12px; padding: 14px 18px; font-size: 12.5px; color: #6b5fa0; }}
        .footer {{ background: #f8f7ff; padding: 20px 40px; text-align: center; font-size: 12px; color: #a09bbf; border-top: 1px solid #ede9fe; }}
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>🔗 FWT</h1>
          <p>Freelancer Work Tracker</p>
        </div>
        <div class="body">
          <h2>Reset your password</h2>
          <p>We received a request to reset your password. Click the button below to set a new one. This link expires in <strong>15 minutes</strong>.</p>
          <a href="{reset_url}" class="btn">Reset Password →</a>
          <div class="note">
            🔒 If you did not request this, you can safely ignore this email. Your password will not change.
          </div>
        </div>
        <div class="footer">
          © 2026 Freelancer Work Tracker · This is an automated email, please do not reply.
        </div>
      </div>
    </body>
    </html>
    """

    # ── Build message ──
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "🔑 Reset your FWT password"
    msg["From"]    = f"FWT App <{MAIL_FROM}>"
    msg["To"]      = to_email
    msg.attach(MIMEText(html, "html"))

    # ── Send via Gmail SMTP ──
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        server.sendmail(MAIL_FROM, to_email, msg.as_string())

    print(f"✅ Reset email sent to {to_email}")


def send_client_portal_email(to_email: str, client_name: str, password: str, freelancer_name: str = "Your Freelancer"):
    portal_url = f"{FRONTEND_URL}/client-login"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f0faf9; margin: 0; padding: 0; }}
        .wrapper {{ max-width: 520px; margin: 40px auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 32px rgba(29,120,116,0.12); }}
        .header {{ background: linear-gradient(90deg, #1d7874, #2a9d8f); padding: 36px 40px; text-align: center; }}
        .header h1 {{ color: white; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px; }}
        .header p {{ color: rgba(255,255,255,0.80); margin: 6px 0 0; font-size: 13px; }}
        .body {{ padding: 36px 40px; }}
        .body h2 {{ color: #1a1040; font-size: 20px; margin: 0 0 12px; }}
        .body p {{ color: #64748b; font-size: 14px; line-height: 1.7; margin: 0 0 16px; }}
        .credentials {{ background: #f0faf9; border: 1px solid rgba(29,120,116,0.20); border-radius: 14px; padding: 18px 20px; margin: 0 0 24px; }}
        .cred-row {{ display: flex; gap: 12px; margin-bottom: 10px; font-size: 14px; }}
        .cred-row:last-child {{ margin-bottom: 0; }}
        .cred-label {{ font-weight: 700; color: #1d7874; min-width: 80px; }}
        .cred-value {{ color: #1a1040; font-weight: 600; }}
        .btn {{ display: block; width: fit-content; margin: 0 auto 24px; background: linear-gradient(90deg, #1d7874, #2a9d8f); color: white; text-decoration: none; padding: 14px 36px; border-radius: 999px; font-weight: 700; font-size: 15px; }}
        .note {{ background: #f6f4ff; border: 1px solid rgba(124,58,237,0.15); border-radius: 12px; padding: 14px 18px; font-size: 12.5px; color: #6b5fa0; }}
        .footer {{ background: #f8f7ff; padding: 20px 40px; text-align: center; font-size: 12px; color: #a09bbf; border-top: 1px solid #ede9fe; }}
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>FWT Client Portal</h1>
          <p>Freelancer Work Tracker</p>
        </div>
        <div class="body">
          <h2>Hello, {client_name}!</h2>
          <p><strong>{freelancer_name}</strong> has given you access to track your project progress, tasks, and invoices on the FWT Client Portal.</p>
          <div class="credentials">
            <div class="cred-row">
              <span class="cred-label">Portal URL</span>
              <span class="cred-value">{portal_url}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Email</span>
              <span class="cred-value">{to_email}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Password</span>
              <span class="cred-value">{password}</span>
            </div>
          </div>
          <a href="{portal_url}" class="btn">Access My Portal →</a>
          <div class="note">
            You can view your project progress, completed tasks, hours logged, and invoices. Please keep your credentials safe.
          </div>
        </div>
        <div class="footer">
          © 2026 Freelancer Work Tracker · This is an automated email, please do not reply.
        </div>
      </div>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"🔗 Your Client Portal Access — FWT"
    msg["From"]    = f"FWT App <{MAIL_FROM}>"
    msg["To"]      = to_email
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        server.sendmail(MAIL_FROM, to_email, msg.as_string())

    print(f"✅ Client portal email sent to {to_email}")