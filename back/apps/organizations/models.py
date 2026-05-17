import uuid
from django.db import models
from django.conf import settings

class Organization(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    radius = models.IntegerField(default=100)
    start_time = models.TimeField(null=True, blank=True) 
    end_time = models.TimeField(null=True, blank=True)

    def __str__(self):
        return self.name

class Invitation(models.Model):
    # Role-ийг энд давхар тодорхойлох эсвэл User модель дээрхтэй ижил байлгах
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('employee', 'Employee'),
    )

    email = models.EmailField()
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    department = models.ForeignKey('Department', on_delete=models.SET_NULL, null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    is_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.email} -> {self.organization.name} ({self.role})"
    

class Department(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} ({self.organization.name})"

class Team(models.Model):
    name = models.CharField(max_length=100)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='teams')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='teams', null=True, blank=True)
    members = models.ManyToManyField('users.User', related_name='teams', blank=True) # Олон ажилтан нэг багт байж болно

    def __str__(self):
        return self.name
