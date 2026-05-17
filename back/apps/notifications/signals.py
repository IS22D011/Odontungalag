from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from apps.tasks.models import Task
from .models import Notification

@receiver(m2m_changed, sender=Task.assigned_to.through)
def task_assigned_notification(sender, instance, action, pk_set, **kwargs):
    # Хэрэглэгчдийг Task-д нэмэх үед (assigned_to талбарт)
    if action == "post_add":
        for user_id in pk_set:
            Notification.objects.create(
                user_id=user_id,
                title="Шинэ даалгавар! 📝",
                message=f"Танд '{instance.title}' нэртэй шинэ даалгавар оноогдлоо.",
                task=instance
            )