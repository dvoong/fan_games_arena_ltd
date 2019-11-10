from accounts.email import generate_password_reset_email, generate_verification_email
from accounts.email import send_password_reset_email, send_verification_email
from accounts.email import verification_email_template
from django.test import TestCase
from unittest.mock import Mock, patch

class TestGeneratePasswordResetEmail(TestCase):

    @patch('accounts.email.get_domain')
    def test_get_domain(self, get_domain):
        request = Mock()
        user = Mock()
        body = generate_password_reset_email(request, user)
        get_domain.assert_called_once_with(request)

    @patch('accounts.email.generate_verification_token')
    def test_generate_verification_token(self, generate_verification_token):
        user = Mock()
        request = Mock()
        body = generate_password_reset_email(request, user)
        generate_verification_token.assert_called_once_with(user)

    @patch('accounts.email.generate_hashed_uid')
    def test_generate_hashed_uid(self, generate_hashed_uid):
        user = Mock()
        request = Mock()
        body = generate_password_reset_email(request, user)
        generate_hashed_uid.assert_called_once_with(user)

    @patch('accounts.email.password_reset_email_template')
    @patch('accounts.email.generate_hashed_uid')
    @patch('accounts.email.generate_verification_token')
    @patch('accounts.email.get_domain')
    def test_returns_populated_template(
            self,
            get_domain,
            generate_verification_token,
            generate_hashed_uid,
            password_reset_email_template
    ):
        user = Mock()
        request = Mock()
        body = generate_password_reset_email(request, user)
        password_reset_email_template.format.assert_called_once_with(
            get_domain.return_value,
            generate_hashed_uid.return_value,
            generate_verification_token.return_value
        )
        expected = password_reset_email_template.format.return_value
        self.assertEqual(body, expected)
    

class TestGenerateVerificationEmail(TestCase):

    @patch('accounts.email.get_domain')
    def test_get_domain(self, get_domain):
        user = Mock()
        request = Mock()
        
        body = generate_verification_email(request, user)

        get_domain.assert_called_once_with(request)

    @patch('accounts.email.generate_verification_token')
    def test_generate_verification_token(self, generate_verification_token):
        user = Mock()
        request = Mock()

        body = generate_verification_email(request, user)

        generate_verification_token.assert_called_once_with(user)

    @patch('accounts.email.generate_hashed_uid')
    def test_generate_hashed_uid(self, generate_hashed_uid):
        user = Mock()
        request = Mock()

        body = generate_verification_email(request, user)

        generate_hashed_uid.assert_called_once_with(user)

    @patch('accounts.email.verification_email_template')
    @patch('accounts.email.generate_hashed_uid')
    @patch('accounts.email.generate_verification_token')
    @patch('accounts.email.get_domain')
    def test(
            self,
            get_domain,
            generate_verification_token,
            generate_hashed_uid,
            email_verification_template
    ):
        user = Mock()
        request = Mock()

        body = generate_verification_email(request, user)

        email_verification_template.format.assert_called_once_with(
            get_domain.return_value,
            generate_hashed_uid.return_value,
            generate_verification_token.return_value
        )

        expected = email_verification_template.format.return_value
        self.assertEqual(body, expected)

    
class TestSendPasswordResetEmail(TestCase):

    @patch('accounts.email.send_mail')
    def test(self, send_mail):
        email_address = 'test@test.com'
        email_body = 'email_body'
        sender = 'registration@ab-testing-tool.com'
        subject = 'AB Testing Tool: Password reset'
        
        send_password_reset_email(email_address, email_body)
        
        send_mail.assert_called_once_with(subject, email_body, sender, [email_address])


class TestSendVerificationEmail(TestCase):

    @patch('accounts.email.send_mail')
    def test(self, send_mail):
        email_address = 'test@test.com'
        email_body = 'email_body'
        sender = 'registration@ab-testing-tool.com'
        subject = 'AB Testing Tool: Email verification'
        
        send_verification_email(email_body, email_address)
        
        send_mail.assert_called_once_with(subject, email_body, sender, [email_address])
