from django.db import models
from django.conf import settings
from django.utils import timezone
import datetime

class Attendance(models.Model):
    # Төлөвийн сонголтууд
    STATUS_CHOICES = (
        ('IN', 'Ирсэн'),
        ('OUT', 'Тарсан'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attendances')
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE)
    
    # check_in талбарыг auto_now_add=True хэвээр үлдээж болно, 
    # гэхдээ нэрийг нь 'timestamp' гэвэл илүү тохиромжтой (Ирсэн, явсан аль аль цагийг хадгалах тул)
    check_in = models.DateTimeField(auto_now_add=True, verbose_name="Бүртгүүлсэн цаг")
    
    # Төлөв хадгалах талбар (ЗААВАЛ НЭМЭХ)
    status = models.CharField(max_length=5, choices=STATUS_CHOICES, default='IN', verbose_name="Төлөв")

    lat = models.FloatField(null=True, blank=True, verbose_name="Ирц өгсөн өргөрөг")
    lng = models.FloatField(null=True, blank=True, verbose_name="Ирц өгсөн уртраг")

    class Meta:
        ordering = ['-check_in']
        verbose_name = "Ирц"
        verbose_name_plural = "Ирцүүд"


class LeaveRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Хүлээгдэж буй'),
        ('approved', 'Зөвшөөрсөн'),
        ('rejected', 'Татгалзсан'),
    )
    
    LEAVE_TYPES = (
        ('sick', 'Өвчтэй'),
        ('annual', 'Ээлжийн амралт'),
        ('personal', 'Хувийн чөлөө'),
        ('other', 'Бусад'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='my_leaves')
    approver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leaves')
    
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPES, default='personal')
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - {self.start_date}"