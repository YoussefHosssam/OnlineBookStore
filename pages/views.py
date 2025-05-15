from django.shortcuts import render , redirect
def index (request) :
    if request.user.is_authenticated :
        if request.user.role == 'admin' :
            return redirect('administration')
        elif request.user.role == 'user' :
            return redirect('app')
    else :
        return render( request , 'pages/index.html' , {} )
def login (request) :
    if request.user.is_authenticated:
        return redirect('index') 
    return render( request , 'pages/login.html' )
def signup (request) :
    if request.user.is_authenticated:
        return redirect('index') 
    return render( request , 'pages/sign_up.html' )
def forgot_password (request) :
    if request.user.is_authenticated:
        return redirect('index') 
    return render( request , 'pages/forgot_password.html' )