from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    created_at_human = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'is_read', 'created_at', 'created_at_human', 'task']

    def get_created_at_human(self, obj):
        return obj.created_at.strftime("%Y-%m-%d %H:%M")