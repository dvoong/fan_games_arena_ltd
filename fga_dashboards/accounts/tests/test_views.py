import urllib
from accounts.views import password_reset_request, registration
from django.core import mail
from django.test import TestCase
from django.urls import resolve
from django.contrib.auth.models import User
from unittest.mock import Mock, patch

# Create your tests here.

class TestEmailHasBeenVerified(TestCase):

    def test_resolver(self):
        resolver = resolve('/accounts/email-has-been-verified')
        self.assertEqual(resolver.view_name, 'email_has_been_verified')

    def test_template(self):
        template = 'accounts/email_has_been_verified.html'
        response = self.client.get('/accounts/email-has-been-verified')
        self.assertTemplateUsed(response, template)

class TestEmailVerificationRequest(TestCase):

    def test_resolver(self):
        resolver = resolve('/accounts/verification-email-requested')
        self.assertEqual(resolver.view_name, 'verification_email_requested')

    def test_template(self):
        response = self.client.get('/accounts/verification-email-requested')
        self.assertTemplateUsed(response, 'accounts/verification_email_requested.html')


class TestLogin(TestCase):

    def test_resolver(self):
        resolver = resolve('/accounts/login')
        self.assertEqual(resolver.view_name, 'login')

    def test_template_used(self):
        response = self.client.get('/accounts/login')
        self.assertTemplateUsed(response, 'accounts/login.html')

    def test_return_error_if_user_has_not_verified_their_email(self):
        username = 'test@test.com'
        password = '123'
        data = {'email': username, 'password': password, 'password_confirmation': password}
        user = User.objects.create_user(username=username, password=password)
        response = self.client.post('/accounts/login', data)
        self.assertFormError(
            response,
            'form',
            None,
            ['Please verify your email address before logging in, click <a id="resend-verification-link" href="/accounts/resend-verification-email">here</a> to resend the verification email.']
        )

    def test_log_user_in_if_user_has_verified_their_email(self):
        username = 'test@test.com'
        password = '123'
        data = {'email': username, 'password': password, 'password_confirmation': password}
        user = User.objects.create_user(username=username, password=password)
        user.profile.has_verified_email = True
        user.save()
        response = self.client.post('/accounts/login', data)
        self.assertEqual(int(self.client.session['_auth_user_id']), user.pk)

class TestResetPassword(TestCase):

    def test_resolver(self):
        resolver = resolve('/accounts/reset-password/uid/token')
        self.assertEqual(resolver.view_name, 'reset_password')

    
    def test_template_used(self):
        response = self.client.get('/accounts/reset-password/uid/token')
        self.assertTemplateUsed(response, 'accounts/reset_password.html')

    @patch('accounts.views.urlsafe_base64_decode')
    @patch('accounts.views.TokenGenerator')
    @patch('accounts.views.User')
    def test_post_invalid_input(self, User, TokenGenerator, urlsafe_base64_decode):
        username = 'test@test.com'
        password = '123'
        new_password = 'new_password'
        token_generator = Mock()
        token_generator.check_token.return_value = True
        TokenGenerator.return_value = token_generator
        user = User.objects.create_user(username=username, password=password)
        urlsafe_base64_decode.return_value = user.pk
        old_password = user.password
        data = {'password': new_password, 'password_confirmation': new_password + 'asdf'}
        response = self.client.post('/accounts/reset-password/uid/token', data)
        self.assertFormError(
            response,
            'form',
            'password_confirmation',
            ['Passwords do not match']
        )

    @patch('accounts.views.urlsafe_base64_decode')
    @patch('accounts.views.TokenGenerator')
    @patch('accounts.views.User')
    def test_post_redirects(self, User, TokenGenerator, urlsafe_base64_decode):
        username = 'test@test.com'
        password = '123'
        new_password = 'new_password'
        token_generator = Mock()
        token_generator.check_token.return_value = True
        TokenGenerator.return_value = token_generator
        user = User.objects.create_user(username=username, password=password)
        urlsafe_base64_decode.return_value = user.pk
        old_password = user.password
        data = {
            'password': new_password,
            'password_confirmation': new_password
        }
        response = self.client.post('/accounts/reset-password/uid/token', data)
        self.assertRedirects(response, '/accounts/password-reset-done')

    @patch('accounts.views.urlsafe_base64_decode')
    @patch('accounts.views.TokenGenerator')
    def test_post_sets_new_password(self, TokenGenerator, urlsafe_base64_decode):
        username = 'test@test.com'
        password = '123'
        new_password = 'new_password'
        token_generator = Mock()
        token_generator.check_token.return_value = True
        TokenGenerator.return_value = token_generator
        user = User.objects.create_user(username=username, password=password)
        urlsafe_base64_decode.return_value = user.pk
        old_password = user.password
        data = {'password': new_password, 'password_confirmation': new_password}
        response = self.client.post('/accounts/reset-password/uid/token', data)
        user = User.objects.get(pk=user.pk)
        new_password = user.password
        self.assertNotEqual(old_password, new_password)

    @patch('accounts.views.urlsafe_base64_decode')
    def test_post_user_not_found(self, urlsafe_base64_decode):
        username = 'test@test.com'
        password = '123'
        new_password = 'new_password'
        user = User.objects.create_user(username=username, password=password)
        urlsafe_base64_decode.return_value = user.pk + 1
        data = {'password': new_password, 'password_confirmation': new_password}
        response = self.client.post('/accounts/reset-password/uid/token', data)
        self.assertFormError(response, 'form', None, ['Invalid token'])

    @patch('accounts.views.TokenGenerator')
    @patch('accounts.views.urlsafe_base64_decode')
    def test_post_user_not_found(self, urlsafe_base64_decode, TokenGenerator):
        username = 'test@test.com'
        password = '123'
        new_password = 'new_password'
        user = User.objects.create_user(username=username, password=password)
        urlsafe_base64_decode.return_value = user.pk + 1
        token_generator = Mock()
        token_generator.check_token.return_value = False
        TokenGenerator.return_value = token_generator
        data = {'password': new_password, 'password_confirmation': new_password}
        response = self.client.post('/accounts/reset-password/uid/token', data)
        self.assertFormError(response, 'form', None, ['Invalid token'])

        
class TestPasswordResetDone(TestCase):

    def test_resolver(self):
        resolver = resolve('/accounts/password-reset-done')
        self.assertEqual(resolver.view_name, 'password_reset_done')

    def test_template(self):
        template = 'accounts/password_reset_done.html'
        response = self.client.get('/accounts/password-reset-done')
        self.assertTemplateUsed(response, template)
        
class TestPasswordResetRequested(TestCase):

    def test_template_used(self):
        response = self.client.get('/accounts/password-reset-requested')
        self.assertTemplateUsed(response, 'accounts/password_reset_requested.html')

class TestRegistration(TestCase):

    def test_resolver(self):
        resolver = resolve('/accounts/registration')
        self.assertEqual(resolver.view_name, 'registration')

    def test_template_used(self):
        response = self.client.get('/accounts/registration')
        self.assertTemplateUsed(response, 'accounts/registration.html')

    @patch('accounts.views.User')
    @patch('accounts.views.redirect')
    @patch('accounts.views.auth')
    @patch('accounts.views.RegistrationForm')
    @patch('accounts.views.generate_verification_email')
    def test_post_generates_a_verfication_email(
            self,
            generate_verification_email,
            RegistrationForm,
            auth,
            redirect,
            User
    ):
        data = {
            'email': 'voong.david@gmail.com',
            'password': 'asdf',
            'password_confirmation': 'asdf'
        }
        request = Mock()
        request.method = 'POST'
        form = Mock()
        form.cleaned_data = data
        RegistrationForm.return_value = form
        user = User.objects.create_user.return_value

        registration(request)

        generate_verification_email.assert_called_once_with(
            request,
            user
        )

    def test_post_redirects_to_email_verification_page(self):
        data = {
            'email': 'voong.david@gmail.com',
            'password': 'asdf',
            'password_confirmation': 'asdf'
        }
        response = self.client.post('/accounts/registration', data)
        self.assertRedirects(response, '/accounts/verification-email-requested')

    @patch('accounts.views.generate_verification_email')
    @patch('accounts.views.send_verification_email')
    def test_sends_verification_email(self, send_verification_email, generate_verification_email):
        data = {
            'email': 'voong.david@gmail.com',
            'password': 'asdf',
            'password_confirmation': 'asdf'
        }
        response = self.client.post('/accounts/registration', data)
        send_verification_email.assert_called_once_with(
            generate_verification_email.return_value,
            'voong.david@gmail.com',
        )
        
    def test_post_sends_an_email_verification_email(self):
        data = {
            'email': 'voong.david@gmail.com',
            'password': 'asdf',
            'password_confirmation': 'asdf'
        }
        response = self.client.post('/accounts/registration', data)

        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]

        self.assertEqual(email.recipients(), ['voong.david@gmail.com'])
        self.assertEqual(email.from_email, 'registration@ab-testing-tool.com')
        self.assertEqual(email.subject, 'AB Testing Tool: Email verification')
    
        
    def test_post_creates_user(self):
        data = {
            'email': 'voong.david@gmail.com',
            'password': 'asdf',
            'password_confirmation': 'asdf'
        }
        response = self.client.post('/accounts/registration', data)
        self.assertEqual(len(User.objects.all()), 1)
        user = User.objects.first()
        self.assertEqual(user.email, 'voong.david@gmail.com')

        
class TestResendVerificationEmail(TestCase):

    def test_resolver(self):
        resolver = resolve('/accounts/resend-verification-email')
        self.assertEqual(resolver.view_name, 'resend_verification_email')

    def test_template(self):
        template = 'accounts/resend_verification_email.html'
        response = self.client.get('/accounts/resend-verification-email')
        self.assertTemplateUsed(response, template)

    @patch('accounts.views.generate_verification_email')
    @patch('accounts.views.send_verification_email')
    def test_sends_email(self, send_verification_email, generate_verification_email):
        email = 'test@test.com'
        data = {'email': email}
        response = self.client.post('/accounts/resend-verification-email', data)
        send_verification_email.assert_called_once_with(
            generate_verification_email.return_value,
            email
        )

    @patch('accounts.views.generate_verification_email')
    def test_redirects(self, generate_verification_email):
        email = 'test@test.com'
        data = {'email': email}
        response = self.client.post('/accounts/resend-verification-email', data)
        self.assertRedirects(response, '/accounts/verification-email-requested')

    @patch('accounts.views.generate_verification_email')
    def test_returns_error_if_email_is_invalid(self, generate_verification_email):
        email = 'asdf'
        data = {'email': email}
        response = self.client.post('/accounts/resend-verification-email', data)
        self.assertFormError(
            response,
            'form',
            'email',
            ['Enter a valid email address.']
        )


class TestPasswordResetRequest(TestCase):

    def test_resolver(self):
        resolver = resolve('/accounts/password-reset-request')
        self.assertEqual(resolver.view_name, 'password_reset_request')

    def test_if_user_exists_send_reset_password_email(self):
        username = 'test@test.com'
        user = User.objects.create_user(username=username, password='123')
        data = {'email': user.username}
        response = self.client.post('/accounts/password-reset-request', data)
        email = mail.outbox[-1]
        self.assertEqual(email.to, [username])

    def test_invalid_email(self):
        email = 'asdf'
        data = {'email': email}
        response = self.client.post('/accounts/password-reset-request', data)
        self.assertFormError(response, 'form', 'email', ['Enter a valid email address.'])

    @patch('accounts.views.render')
    @patch('accounts.views.send_password_reset_email')
    @patch('accounts.views.generate_password_reset_email')
    def test_post_generates_email(
            self,
            generate_password_reset_email,
            send_password_reset_email,
            render
    ):
        request = Mock(method='POST')
        username = 'test@test.com'
        request.POST = {'email': username}
        user = User.objects.create_user(username=username, password='123')
        response = password_reset_request(request)
        generate_password_reset_email.assert_called_once_with(request, user)

    def test_post_redirect(self):
        email = 'test@test.com'
        data = {'email': email}
        response = self.client.post('/accounts/password-reset-request', data)
        self.assertRedirects(response, '/accounts/password-reset-requested')

    def test_post_redirect_user_exists(self):
        email = 'test@test.com'
        data = {'email': email}
        user = User.objects.create_user(username=email, password='123')
        response = self.client.post('/accounts/password-reset-request', data)
        self.assertRedirects(response, '/accounts/password-reset-requested')
        
    @patch('accounts.views.render')
    @patch('accounts.views.generate_password_reset_email')        
    @patch('accounts.views.send_password_reset_email')
    def test_post_sends_email(
            self,
            send_password_reset_email,
            generate_password_reset_email,
            render
    ):
        request = Mock(method='POST')
        username = 'test@test.com'
        request.POST = {'email': username}
        user = User.objects.create_user(username=username, password='123')
        response = password_reset_request(request)
        send_password_reset_email.assert_called_once_with(
            username,
            generate_password_reset_email.return_value
        )

    def test_post_user_does_not_exist(self):
        data = {'email': 'test@test.com'}
        response = self.client.post('/accounts/password-reset-request', data)
        self.assertEqual(len(mail.outbox), 0)
        
    def test_template(self):
        template = 'accounts/password_reset_request.html'
        response = self.client.get('/accounts/password-reset-request')
        self.assertTemplateUsed(response, template)

class TestVerifyEmail(TestCase):

    @patch('accounts.views.urlsafe_base64_decode')
    @patch('accounts.views.TokenGenerator')
    def test_if_token_is_invalid_returns_invalid_validation_code(
            self,
            TokenGenerator,
            urlsafe_base64_decode
    ):
        username = 'test@test.com'
        password = '123'
        user = User.objects.create_user(username=username, password=password)
        token_generator = Mock()
        token_generator.check_token.return_value = False
        TokenGenerator.return_value = token_generator
        urlsafe_base64_decode.return_value = user.pk

        response = self.client.get('/accounts/verify-email/uid/token')

        self.assertRedirects(response, '/accounts/invalid-email-verification-token')

    @patch('accounts.views.urlsafe_base64_decode')
    def test_if_user_does_not_exist_returns_invalid_validation_code(self, urlsafe_base64_decode):
        urlsafe_base64_decode.return_value = 1
        response = self.client.get('/accounts/verify-email/MG/token')
        self.assertRedirects(response, '/accounts/invalid-email-verification-token')

    @patch('accounts.views.TokenGenerator')
    @patch('accounts.views.urlsafe_base64_decode')
    def test_redirects_to_success_page(self, url_safe_base_64_decode, TokenGenerator):
        user = User.objects.create_user(username='test@test.com', password='123')
        url_safe_base_64_decode.return_value = user.pk
        token_generator = TokenGenerator.return_value
        token_generator.check_token.return_value = True
        
        response = self.client.get('/accounts/verify-email/uid/token')
        self.assertRedirects(response, '/accounts/email-has-been-verified')

    def test_resolver(self):
        resolver = resolve('/accounts/verify-email/uid/token')
        self.assertEqual(resolver.view_name, 'verify_email')

    @patch('accounts.views.TokenGenerator')
    @patch('accounts.views.urlsafe_base64_decode')
    @patch('accounts.views.force_text')    
    def test_updates_has_verified_email_attribute(
            self,
            force_text,
            urlsafe_base64_decode,
            TokenGenerator
    ):
        username = 'test@test.com'
        password = '123'
        user = User.objects.create_user(username=username, password=password)
        self.assertFalse(user.profile.has_verified_email)

        pk = user.pk
        force_text.return_value = str(pk)
        token_generator = Mock()
        token_generator.check_token.return_value = True
        response = self.client.get('/accounts/verify-email/uid/token')
        user = User.objects.get(pk=pk)
        self.assertEqual(user.profile.has_verified_email, True)

    @patch('accounts.views.force_text')    
    @patch('accounts.views.User')
    @patch('accounts.views.urlsafe_base64_decode')    
    def test_uses_uid_to_find_user(self, urlsafe_base64_decode, User, force_text):
        pk = 1
        force_text.return_value = str(pk)

        response = self.client.get('/accounts/verify-email/uid/token')
        
        User.objects.get.assert_called_once_with(pk=str(pk))
