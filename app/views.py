from django.shortcuts import render
from django.contrib.auth.decorators import login_required

@login_required
def home (request) :
    if request.user.is_authenticated and request.user.role == 'admin':
        return render( request , 'administration/dashboard.html' )
    return render( request , 'app/dashboard.html' )
@login_required
def list_books (request) :
    return render( request , 'app/list.html' )
@login_required
def borrowed (request) :
    return render( request , 'app/borrowed.html' )
@login_required
def profile (request) :
    return render( request , 'app/profile.html' )
# Create your views here.
