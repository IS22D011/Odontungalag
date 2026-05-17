from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserViewSet, RegisterView, LoginView, LogoutView, 
    ChangePasswordView, ResetPasswordRequestView, 
    RegisterOrganizationView, AcceptInviteView, 
    VerifyOTPView, ResendOTPView, CreateDisplayUserView, ListDisplayUsersView,
    ResetDisplayPasswordView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    
    # Auth & OTP
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend_otp'),
    
    # Password management
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('reset-password/', ResetPasswordRequestView.as_view(), name='reset_password'),
    
    # Organization & Invitations
    path('register-org/', RegisterOrganizationView.as_view(), name='register_org'),
    # 'invite/' эндпоинтыг organizations/urls.py руу нүүлгэсэн бол эндээс хасаж болно.
    # Хэрэв views.py дотор чинь байгаа бол үлдээж болно:
    path('accept-invite/', AcceptInviteView.as_view(), name='accept_invite'),
    path('create-display/', CreateDisplayUserView.as_view(), name='create-display'),
    path('displays/', ListDisplayUsersView.as_view(), name='list-displays'),
    path('reset-display-password/<int:pk>/', ResetDisplayPasswordView.as_view(), name='reset-display-password'),
]