from django.db import models
from django.conf import settings

class Project(models.Model):
    name = models.CharField(max_length=200, verbose_name="Төслийн нэр")
    description = models.TextField(blank=True, null=True, verbose_name="Тайлбар")
    
    STATUS_CHOICES = [
        ('planning', 'Төлөвлөж буй'),
        ('active', 'Идэвхтэй'),
        ('completed', 'Дууссан'),
        ('on_hold', 'Түр зогссон'),
    ]
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='active',
        verbose_name="Төлөв"
    )

    # Хугацаа
    start_date = models.DateField(null=True, blank=True, verbose_name="Эхлэх огноо")
    end_date = models.DateField(null=True, blank=True, verbose_name="Дуусах огноо")
    
    # Эзэмшигч болон Гишүүд
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="owned_projects",
        verbose_name="Үүсгэсэн"
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        related_name="projects", 
        blank=True,
        verbose_name="Гишүүд"
    )
    departments = models.ManyToManyField(
        'organizations.Department', 
        related_name="projects", 
        blank=True,
        verbose_name="Оролцогч хэлтсүүд"
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Үүсгэсэн огноо")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Шинэчилсэн огноо")

    class Meta:
        verbose_name = "Төсөл"
        verbose_name_plural = "Төслүүд"
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def progress(self):
        """
        Төслийн явцыг хамааралтай даалгавруудын 'status'-аар тооцох.
        Жишээ нь: Нийт даалгаврын хэдэн хувь нь 'done' байгааг гаргана.
        """
        tasks = self.project_tasks.all()
        total_tasks = tasks.count()
        if total_tasks == 0:
            return 0
        
        completed_tasks = tasks.filter(status='done').count()
        return int((completed_tasks / total_tasks) * 100)
    
class Task(models.Model):
    STATUS_CHOICES = (
        ('todo', 'To Do'),
        ('doing', 'Doing'),
        ('review', 'Review'),
        ('done', 'Done'),
    )
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )

    project = models.ForeignKey(
        'Project', 
        on_delete=models.SET_NULL,  # Төсөл уствал Task-ийн project талбарыг NULL болгоно
        null=True,                 # Мэдээллийн санд хоосон байж болно
        blank=True,                # Форм дээр хоосон байж болно
        related_name='tasks'
    )
    title = models.CharField(max_length=255, verbose_name="Даалгаврын нэр")
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='todo')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    # Даалгавар оноогдсон ажилтан (ManyToManyField ашиглан олон хүн оноох боломжтой)
    assigned_to = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        related_name='tasks', 
        blank=True
    )
    
    due_date = models.DateField(null=True, blank=True)
    order = models.PositiveIntegerField(default=0) # Kanban дээрх байрлал
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.title} ({self.project.name})"
    

