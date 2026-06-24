"""
Admin Dashboard & Email Notification Service
Tracks all logins/signups and emails sambitmaths123@gmail.com on every event.
"""

import asyncio
import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from typing import Optional

from backend.app.core.config import settings


async def send_login_alert(
    event_type: str,          # "signup" or "login"
    method: str,              # "password" or "google"
    email: str,
    display_name: Optional[str],
    ip_address: Optional[str],
    user_agent: Optional[str],
    user_id: str,
    created_at: Optional[datetime] = None,
    profile_info: Optional[dict] = None,
):
    """Send an HTML email alert to the admin whenever a user logs in or signs up."""

    if not settings.SMTP_PASSWORD:
        print(f"[EMAIL] SMTP not configured — skipping alert for {email}")
        return

    event_emoji = "🎉" if event_type == "signup" else "🔐"
    method_label = "Google OAuth" if method == "google" else "Email / Password"
    method_color = "#4285F4" if method == "google" else "#f59e0b"
    event_color = "#10b981" if event_type == "signup" else "#6366f1"

    profile_rows = ""
    if profile_info:
        fields = [
            ("Korean Name", profile_info.get("korean_name")),
            ("Native Language", profile_info.get("native_language")),
            ("Proficiency", profile_info.get("korean_proficiency")),
            ("Study Reason", profile_info.get("study_reason")),
            ("Occupation", profile_info.get("occupation")),
            ("Total XP", profile_info.get("total_xp")),
            ("Current Streak", profile_info.get("current_streak")),
        ]
        for label, val in fields:
            if val is not None:
                profile_rows += f"""
                <tr>
                    <td style="padding:8px 12px; color:#9ca3af; font-size:13px; border-bottom:1px solid #1f2937;">{label}</td>
                    <td style="padding:8px 12px; color:#f9fafb; font-size:13px; font-weight:600; border-bottom:1px solid #1f2937;">{val}</td>
                </tr>"""

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background:#09090b; font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b; padding:32px 16px;">
    <tr><td>
      <table width="600" cellpadding="0" cellspacing="0" align="center" 
             style="background:#111827; border-radius:16px; border:1px solid #1f2937; overflow:hidden; max-width:600px; width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,{event_color}22,{method_color}22); padding:28px 32px; border-bottom:1px solid #1f2937;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size:28px;">{event_emoji}</span>
                  <span style="font-size:20px; font-weight:900; color:#f9fafb; margin-left:10px;">
                    애라.ai Admin Alert
                  </span>
                </td>
                <td align="right">
                  <span style="background:{event_color}33; color:{event_color}; border:1px solid {event_color}55;
                               font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1px;
                               padding:4px 12px; border-radius:999px;">
                    {event_type.upper()}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="color:#9ca3af; font-size:14px; margin:0 0 24px 0;">
              A user just <strong style="color:#f9fafb;">{event_type}d</strong> on 애라.ai at <strong style="color:#f9fafb;">{now_str}</strong>.
            </p>

            <!-- Core details table -->
            <table width="100%" cellpadding="0" cellspacing="0" 
                   style="background:#0d1117; border-radius:12px; border:1px solid #1f2937; overflow:hidden;">
              <tr>
                <td style="padding:8px 12px; color:#9ca3af; font-size:13px; border-bottom:1px solid #1f2937;">Email</td>
                <td style="padding:8px 12px; color:#60a5fa; font-size:13px; font-weight:700; border-bottom:1px solid #1f2937;">
                  {email}
                </td>
              </tr>
              <tr>
                <td style="padding:8px 12px; color:#9ca3af; font-size:13px; border-bottom:1px solid #1f2937;">Display Name</td>
                <td style="padding:8px 12px; color:#f9fafb; font-size:13px; font-weight:600; border-bottom:1px solid #1f2937;">
                  {display_name or "—"}
                </td>
              </tr>
              <tr>
                <td style="padding:8px 12px; color:#9ca3af; font-size:13px; border-bottom:1px solid #1f2937;">User ID</td>
                <td style="padding:8px 12px; color:#6b7280; font-size:11px; font-family:monospace; border-bottom:1px solid #1f2937;">
                  {user_id}
                </td>
              </tr>
              <tr>
                <td style="padding:8px 12px; color:#9ca3af; font-size:13px; border-bottom:1px solid #1f2937;">Login Method</td>
                <td style="padding:8px 12px; border-bottom:1px solid #1f2937;">
                  <span style="background:{method_color}22; color:{method_color}; border:1px solid {method_color}55;
                               font-size:11px; font-weight:800; padding:3px 10px; border-radius:999px;">
                    {method_label}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 12px; color:#9ca3af; font-size:13px; border-bottom:1px solid #1f2937;">IP Address</td>
                <td style="padding:8px 12px; color:#f9fafb; font-size:13px; font-family:monospace; border-bottom:1px solid #1f2937;">
                  {ip_address or "Unknown"}
                </td>
              </tr>
              <tr>
                <td style="padding:8px 12px; color:#9ca3af; font-size:13px;">User Agent</td>
                <td style="padding:8px 12px; color:#6b7280; font-size:11px; border:none;">
                  {(user_agent or "Unknown")[:100]}
                </td>
              </tr>
              {profile_rows}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px; border-top:1px solid #1f2937; text-align:center;">
            <p style="color:#374151; font-size:11px; margin:0;">
              애라.ai Admin Notification System · For testing only
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"[애라.ai] {event_emoji} User {event_type.title()} — {email}"
    msg["From"] = settings.SMTP_USER
    msg["To"] = settings.ADMIN_EMAIL

    msg.attach(MIMEText(html_body, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=True,
        )
        print(f"[EMAIL] ✓ Alert sent to {settings.ADMIN_EMAIL} for {event_type} — {email}")
    except Exception as e:
        print(f"[EMAIL] ✗ Failed to send alert: {e}")
