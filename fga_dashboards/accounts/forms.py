import django.forms as forms
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.models import User
    
class LoginForm(forms.Form):

    username = forms.CharField()
    password = forms.CharField(widget=forms.PasswordInput)
