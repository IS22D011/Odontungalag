from rest_framework import serializers
from .models import ChatRoom, Message
from apps.users.serializers import UserSerializer

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.first_name')
    sender_id = serializers.ReadOnlyField(source='sender.id')
    
    class Meta:
        model = Message
        fields = ['id', 'room', 'sender', 'sender_id', 'sender_name', 'text', 'timestamp']

class ChatRoomSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'is_group', 'is_admin', 'last_message', 'member_count', 'created_at']

    def get_last_message(self, obj):
        """
        Чат жагсаалтад харагдах хамгийн сүүлийн мессеж
        """
        message = obj.messages.order_by('-timestamp').first()
        if message:
            return {
                'text': message.text,
                'sender_name': message.sender.first_name,
                'timestamp': message.timestamp
            }
        return None

    def get_is_admin(self, obj):
        """
        Нэвтэрсэн хэрэглэгч энэ чатыг удирдах (гишүүн нэмэх/хасах) эрхтэй эсэх
        """
        request = self.context.get('request')
        if request and request.user:
            # Model дээр бичсэн has_management_permission функцийг дуудаж байна
            return obj.has_management_permission(request.user)
        return False

    def get_member_count(self, obj):
        """
        Группт байгаа нийт гишүүдийн тоо
        """
        return obj.users.count()