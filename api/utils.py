# utils.py
import random
from twilio.rest import Client
from django.conf import settings

import random
from twilio.rest import Client
from django.conf import settings

def otp_generator(phone_number: str) -> str:
    """
    Generates a 4-digit OTP and sends it via WhatsApp using Twilio.
    
    Args:
        phone_number (str): Recipient's phone number in E.164 format (e.g., +2010XXXXXXX).
    
    Returns:
        str: The generated OTP.
    """
    otp = str(random.randint(1000, 9999))

    message_body = (
        f"Thank you for joining BORRI!\n"
        f"Your OTP is: {otp}\n"
        f"⚠️ Please do not share this OTP with anyone."
    )

    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

    client.messages.create(
        body=message_body,
        from_=settings.TWILIO_WHATSAPP_NUMBER,
        to=f"whatsapp:{phone_number}"
    )

    return otp
