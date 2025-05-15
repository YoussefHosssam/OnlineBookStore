from django.urls import path
from . import views
urlpatterns = [
    path('' , views.home , name='app'),
    path('list/' , views.list_books , name='list'),
    path('borrowed/' , views.borrowed , name='borrowed'),
    path('profile/' , views.profile , name='profile'),
]