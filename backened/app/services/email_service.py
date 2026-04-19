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