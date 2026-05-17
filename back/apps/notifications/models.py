from django.db import models
from django.conf import settings

class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='notifications'
    )
    title = models.CharField(max_length=255, verbose_name="Гарчиг")
    message = models.TextField(verbose_name="Зурвас")
    is_read = models.BooleanField(default=False, verbose_name="Уншсан эсэх")
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Task-тай холбох (tasks апп-ын Task модельтой)
    task = models.ForeignKey(
        'tasks.Task', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='task_notifications'
    )

    class Meta:
        verbose_name = "Мэдэгдэл"
        verbose_name_plural = "Мэдэгдлүүд"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.title}"