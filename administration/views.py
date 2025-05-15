from django.shortcuts import render , redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
@login_required
def home(request):
    if request.user.is_authenticated and request.user.role == 'admin':
        return render(request, 'administration/dashboard.html')
    elif request.user.is_authenticated and request.user.role == 'user':
        return render(request, 'app/dashboard.html')

@login_required
def users (request) :
    if request.user.is_authenticated and request.user.role == 'admin':
        return render(request, 'administration/users.html')
    elif request.user.is_authenticated and request.user.role == 'user':
        return render(request, 'app/dashboard.html')
@login_required
def edit (request) :
    if request.user.is_authenticated and request.user.role == 'admin':
        return render(request, 'administration/edit.html')
    elif request.user.is_authenticated and request.user.role == 'user':
        return render(request, 'app/dashboard.html')
@login_required
def add (request) :
    if request.user.is_authenticated and request.user.role == 'admin':
        return render(request, 'administration/add.html')
    elif request.user.is_authenticated and request.user.role == 'user':
        return render(request, 'app/dashboard.html')
# Create your views here.
