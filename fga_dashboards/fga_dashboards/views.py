from django.http import HttpResponse
from django.shortcuts import redirect, render


def home(request):
    context = {}
    template = 'home.html'
    return render(request, template, context)

def index(request):
    if request.user.is_authenticated:
        return redirect('/home')
    else:
        return redirect('/accounts/login')

