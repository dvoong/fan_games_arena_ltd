from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from accounts import views, forms

urlpatterns = [
    path('logout', views.logout, name='logout'),
    path('logout/', views.logout, name='logout'),
    path('login', views.login, name='login'),
]
