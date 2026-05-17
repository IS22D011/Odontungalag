from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import datetime

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('employee', 'Employee'),
        ('display', 'Display'),
    )
    
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    organization = models.ForeignKey(
        'organizations.Organization', 
        on_delete=models.CASCADE, 
        related_name='users', 
        null=True, 
        blank=True
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='employee')
    
    # ЭНЭ ХЭСЭГТ: organizations.Department руу зааж өгнө
    department = models.ForeignKey(
        'organizations.Department', # String reference ашиглах нь Circular Import-оос сэргийлнэ
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='members' # Хэлтэс доторх хэрэглэгчдийг дуудахад ашиглана
    )
    
    phone = models.CharField(max_length=15, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

class VerificationCode(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='verification_code')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.created_at + datetime.timedelta(minutes=10)

    def __str__(self):
        return f"{self.user.email} - {self.code}"