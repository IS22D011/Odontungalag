from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from .models import Task
from apps.notifications.models import Notification

@receiver(m2m_changed, sender=Task.assigned_to.through)
def task_assigned_notification(sender, instance, action, pk_set, **kwargs):
    if action == "post_add":  # Хэрэглэгчдийг нэмсний дараа
        for user_id in pk_set:
            Notification.objects.create(
                user_id=user_id,
                title="Шинэ даалгавар!",
                message=f"Танд '{instance.title}' даалгавар оноогдлоо.",
                task=instance
            )
            # Энд FCM илгээх функцийг дуудаж болно