from django.urls import path
from . import views
urlpatterns = [
    path('register/' , views.register , name='registerapi'),
    path('login/' , views.loginfun , name='loginapi'),
    path('book/list/' , views.list_book , name='listapi'),
    path('user/logout/' , views.logout_view , name='logout'),
    path('user/profile/info/' , views.profileinfo , name='profileinfo'),
    path('user/profile/edit/info/' , views.editprofile , name='editprofile'),
    path('user/list/info/' , views.listusers , name='listusers'),
    path('user/list/info/edit/<int:user_id>/' , views.editusers , name='editusers'),
    path('user/delete/<int:user_id>/' , views.deleteusers , name='deleteusers'),
    path('book/delete/<int:book_id>/' , views.deletebooks , name='deletebooks'),
    path('book/edit/<int:book_id>/' , views.editbooks , name='editbooks'),
    path('book/add/' , views.addbooks , name='addbooks'),
    path('book/borrow/<int:book_id>/' , views.borrowbooks , name='borrowbooks'),
    path('book/list/borrowed/' , views.listborrow , name='listborrow'),
    path('user/details/<int:user_id>/' , views.UserDetail , name='userdetails'),
    path('book/search/' , views.booksearch , name='search'),
    path('user/password/reset/' , views.resetpassword , name='resetpassword'),
    path('user/password/reset/confirm/<uidb64>/<token>/' , views.resetpasswordconfirm , name='resetpasswordconfirm'),
    path('book/return/<int:book_id>/' , views.returnbook , name='returnbook'),
]