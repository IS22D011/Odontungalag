from django.db import models
from django.conf import settings

class ChatRoom(models.Model):
    name = models.CharField(max_length=255)
    users = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='chat_rooms')
    # Групп чатыг удирдах эрхтэй хүмүүс
    admins = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='admin_rooms', blank=True)
    # Хэлтсийн чат бол хэлтэстэй нь холбоно
    department = models.OneToOneField('organizations.Department', on_delete=models.CASCADE, null=True, blank=True, related_name='chat_room')
    is_group = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    def has_management_permission(self, user):
        """
        Удирдах эрх шалгах: Системийн админ, Менежер (хэлтсийн), эсвэл Групп админ
        """
        if hasattr(user, 'role') and user.role == 'admin':
            return True
        if self.admins.filter(id=user.id).exists():
            return True
        if hasattr(user, 'role') and user.role == 'manager':
            # Хэрэв хэрэглэгч менежер бөгөөд тухайн хэлтсийнх бол
            if self.department and user.department == self.department:
                return True
        return False

class Message(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender.email}: {self.text[:20]}"