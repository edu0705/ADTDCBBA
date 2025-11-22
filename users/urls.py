# users/urls.py
from django.urls import path
from .views import UserInfoAPIView, UserNotificationsView

urlpatterns = [
    path('user-info/', UserInfoAPIView.as_view(), name='user_info'),
    path('notifications/', UserNotificationsView.as_view(), name='user_notifications'),
]