from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CheckInView, MyAttendanceListView, AttendanceListView,
    DetailedAttendanceListView, OrganizationReportView, AttendanceWorkLogView,MyStatsView
    , LeaveRequestViewSet
)
router = DefaultRouter()
router.register(r'leaves', LeaveRequestViewSet, basename='leave')
urlpatterns = [
    path('', include(router.urls)),
    path("attendance-list/", AttendanceListView.as_view(), name="attendance-list"),
    path("check-in/", CheckInView.as_view(), name="check-in"),
    path("my-attendance/", MyAttendanceListView.as_view(), name="my-attendance"),
    path("report/summary/", OrganizationReportView.as_view(), name="org-report"),
    path("detailed-attendance/", DetailedAttendanceListView.as_view(), name="detailed-attendance"),
    path("work-logs/", AttendanceWorkLogView.as_view(), name="work-logs"),
    path("my-stats/", MyStatsView.as_view(), name="my-stats"),
]