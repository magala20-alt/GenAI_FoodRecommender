from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings


logger = logging.getLogger(__name__)


def send_password_reset_email(recipient_email: str, recipient_name: str, reset_url: str) -> None:
    subject = "CareSync password reset"
    plain_text = (
        f"Hello {recipient_name or 'there'},\n\n"
        f"We received a request to reset your CareSync password.\n"
        f"Use this link to continue: {reset_url}\n\n"
        "This link expires in 15 minutes and can only be used once.\n"
        "If you did not request this reset, you can safely ignore this email.\n"
    )

    if not settings.smtp_host:
        logger.info("Password reset email to %s: %s", recipient_email, reset_url)
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.email_from_address
    message["To"] = recipient_email
    message.set_content(plain_text)

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            if settings.smtp_username:
                smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(message)
    except Exception:
        logger.exception("Failed to send password reset email to %s", recipient_email)
