from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.contrib.sites.shortcuts import get_current_site
from django.core.mail import send_mail
from django.utils import six
from django.utils.encoding import force_bytes, force_text
from django.utils.http import urlsafe_base64_encode

password_reset_email_template = ''' A password reset has been request for this account, click the following link to reset your password, http://{}/accounts/reset-password/{}/{}'''
verification_email_template = ''' Please verify your email by clicking on the following link, http://{}/accounts/verify-email/{}/{}'''

class TokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        return (
            six.text_type(user.pk) + six.text_type(timestamp) +
            six.text_type(user.is_active)
        )

def generate_hashed_uid(user):
    return force_text(urlsafe_base64_encode(force_bytes(user.pk)))

def generate_verification_token(user):
    return TokenGenerator().make_token(user)

def get_domain(request):
    return get_current_site(request).domain

def generate_password_reset_email(request, user):
    domain = get_domain(request)
    hashed_id = generate_hashed_uid(user)
    token = generate_verification_token(user)
    return password_reset_email_template.format(domain, hashed_id, token)

def generate_verification_email(request, user):
    domain = get_domain(request)
    hashed_uid = generate_hashed_uid(user)
    token = generate_verification_token(user)
    return verification_email_template.format(domain, hashed_uid, token)

def send_password_reset_email(email_address, email_body):
    sender = 'registration@ab-testing-tool.com'
    subject = 'AB Testing Tool: Password reset'
    return send_mail(subject, email_body, sender, [email_address])

def send_verification_email(email_body, email_address):
    sender = 'registration@ab-testing-tool.com'
    subject = 'AB Testing Tool: Email verification'
    return send_mail(subject, email_body, sender, [email_address])


