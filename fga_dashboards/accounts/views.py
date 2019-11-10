import django.contrib.auth as auth
from accounts.forms import LoginForm
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.utils.encoding import force_text
from django.utils.http import urlsafe_base64_decode
from django.utils.safestring import mark_safe

# Create your views here.

def logout(request):
    auth.logout(request)
    return redirect(settings.LOGOUT_REDIRECT_URL)

def login(request):
    if request.method == 'GET':
        form = LoginForm()
    else:
        form = LoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user = auth.authenticate(username=username, password=password)
            if user:
                auth.login(request, user)
                return redirect(request.GET.get('next', settings.LOGIN_REDIRECT_URL))
            else:
                form.add_error(None, 'Username and password not matched')
    return render(request, 'accounts/login.html', {'form': form})
