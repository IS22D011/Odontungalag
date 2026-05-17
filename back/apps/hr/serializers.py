from rest_framework import serializers
from .models import Attendance
from apps.users.serializers import UserSerializer
from .models import LeaveRequest


class AttendanceSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_details = UserSerializer(source="user", read_only=True)
    organization_name = serializers.ReadOnlyField(source="organization.name")
    timestamp = serializers.DateTimeField(source="check_in", read_only=True)

    class Meta:
        model = Attendance
        fields = [
            "id", "user", "user_name", "user_details",
            "organization", "organization_name",
            "timestamp", "status", "lat", "lng",
        ]
        read_only_fields = ["id", "timestamp", "organization", "user"]

    def get_user_name(self, obj):
        if obj.user.first_name:
            return f"{obj.user.first_name} {obj.user.last_name}".strip()
        return obj.user.email


class AttendanceCheckInSerializer(serializers.Serializer):
    method = serializers.ChoiceField(choices=["gps", "qr"])
    lat = serializers.FloatField(required=False, allow_null=True)
    lng = serializers.FloatField(required=False, allow_null=True)
    # QR-с status авч болох тул optional болгов
    status = serializers.ChoiceField(choices=["IN", "OUT"], required=False, allow_null=True)
    qr_payload = serializers.CharField(required=False, allow_null=True, allow_blank=True)



class LeaveRequestSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.get_full_name')
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ['user', 'status', 'approver']