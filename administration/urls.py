from django.urls import path
from . import views
urlpatterns = [
    path('' , views.home , name='administration'),
    path('users/' , views.users , name='users'),
    path('edit/' , views.edit , name='edit'),
    path('add/' , views.add , name='add'),
]