from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.tasks.models import Task
from apps.notifications.models import Notification

class Command(BaseCommand):
    help = 'Дуусах хугацаа нь дөхсөн task-уудыг шалгаж мэдэгдэл илгээнэ'

    def handle(self, *args, **options):
        # Маргааш дуусах task-уудыг олох
        tomorrow = timezone.now().date() + timedelta(days=1)
        due_tasks = Task.objects.filter(due_date=tomorrow).exclude(status='done')
        for task in due_tasks:
            for user in task.assigned_to.all():
                # Өмнө нь энэ мэдэгдлийг илгээсэн эсэхийг шалгаж болно
                Notification.objects.get_or_create(
                    user=user,
                    title="Хугацаа дөхөж байна ⚠️",
                    message=f"'{task.title}' даалгавар маргааш дуусна.",
                    task=task
                )
        self.stdout.write(self.style.SUCCESS('Амжилттай шалгаж дууслаа'))