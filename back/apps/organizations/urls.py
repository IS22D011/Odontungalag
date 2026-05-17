from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, TeamViewSet, InviteEmployeeView, OrganizationMemberViewSet, UpdateOrganizationView, MyOrganizationView

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'members', OrganizationMemberViewSet, basename='member') 

urlpatterns = [
    path('', include(router.urls)),
    path('invite/', InviteEmployeeView.as_view(), name='invite_employee'), 
    path('update-org/', UpdateOrganizationView.as_view(), name='update-org'),
    path('my-org/', MyOrganizationView.as_view(), name='my-org'),

]