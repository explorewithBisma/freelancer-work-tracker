import html as html_lib
import logging
import os

import httpx

from app.demo import is_demo_domain

logger = logging.getLogger("app.email")

BREVO_URL = "https://api.brevo.com/v3/smtp/email"


def frontend_url() -> str:
    # First entry if FRONTEND_URL is comma-separated; no trailing slash.
    raw = os.getenv("FRONTEND_URL", "http://localhost:3000")
    return raw.split(",")[0].strip().rstrip("/")


def _send_email(to_email: str, subject: str, html: str) -> bool:
    """Send via Brevo's HTTP API. Never raises; returns True on success."""
    if is_demo_domain(to_email):
        logger.info("Email to demo address %s skipped", to_email)
        return False
    api_key = os.getenv("BREVO_API_KEY")
    mail_from = os.getenv("MAIL_FROM")
    if not api_key or not mail_from:
        logger.error("Email not sent to %s: BREVO_API_KEY or MAIL_FROM is not set", to_email)
        return False
    payload = {
        "sender": {"name": os.getenv("MAIL_FROM_NAME", "FWT App"), "email": mail_from},
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html,
    }
    try:
        resp = httpx.post(
            BREVO_URL,
            json=payload,
            headers={"api-key": api_key, "accept": "application/json"},
            timeout=10,
        )
        if resp.status_code >= 300:
            logger.error("Brevo rejected email to %s: %s %s", to_email, resp.status_code, resp.text[:300])
            return False
    except Exception:
        logger.exception("Brevo request failed for email to %s", to_email)
        return False
    logger.info("Email sent to %s", to_email)
    return True


def send_reset_email(to_email: str, token: str) -> bool:
    reset_url = f"{frontend_url()}/reset-password?token={token}"

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

    return _send_email(to_email, "🔑 Reset your FWT password", html)


def send_client_portal_email(to_email: str, client_name: str, set_password_url: str,
                             freelancer_name: str = "Your Freelancer") -> bool:
    """Invitation email with a one-time 'Set your password' link. Never contains a password."""
    portal_url = f"{frontend_url()}/client-login"
    client_name = html_lib.escape(client_name or "")
    freelancer_name = html_lib.escape(freelancer_name or "Your Freelancer")

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
        .btn {{ display: block; width: fit-content; margin: 0 auto 24px; background: linear-gradient(90deg, #1d7874, #2a9d8f); color: white; text-decoration: none; padding: 14px 36px; border-radius: 999px; font-weight: 700; font-size: 15px; }}
        .note {{ background: #f6f4ff; border: 1px solid rgba(124,58,237,0.15); border-radius: 12px; padding: 14px 18px; font-size: 12.5px; color: #6b5fa0; margin-bottom: 12px; }}
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
          <p><strong>{freelancer_name}</strong> has invited you to the FWT Client Portal, where you can follow your project progress, tasks, hours logged and invoices.</p>
          <p>To get started, set your password using the button below. Your login email is <strong>{html_lib.escape(to_email)}</strong>.</p>
          <a href="{set_password_url}" class="btn">Set your password →</a>
          <div class="note">
            ⏳ This link expires in <strong>24 hours</strong> and can be used only once. If it expires, ask {freelancer_name} to send a new invitation.
          </div>
          <div class="note">
            After setting your password, sign in any time at <a href="{portal_url}">{portal_url}</a>.
          </div>
        </div>
        <div class="footer">
          © 2026 Freelancer Work Tracker · This is an automated email, please do not reply.
        </div>
      </div>
    </body>
    </html>
    """

    return _send_email(to_email, "🔗 Set up your Client Portal access — FWT", html)
