from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Project, Task
from .serializers import ProjectSerializer, TaskSerializer
from rest_framework.permissions import AllowAny

from django.db.models import Q

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # 1. Хэрэв админ бол бүх төслийг харна
        # Таны хэрэглэгчийн роль 'admin' гэж хадгалагддаг бол:
        if getattr(user, 'role', None) == 'admin' or user.is_staff:
            return Project.objects.all()
        
        # 2. Энгийн хэрэглэгч бол:
        # Өөрийнх нь үүсгэсэн (owner) ЭСВЭЛ гишүүнээр нь орсон (members) төслүүдийг харуулна
        return Project.objects.filter(
            Q(owner=user) | Q(members=user)
        ).distinct() # distinct() нь давхардал үүсэхээс сэргийлнэ

    def perform_create(self, serializer):
        # Төсөл үүсгэхэд owner-ийг нь одоогийн хэрэглэгчээр тохируулна
        serializer.save(owner=self.request.user)

class TaskViewSet(viewsets.ModelViewSet):
    http_method_names = ['get', 'post', 'patch', 'delete', 'put', 'head', 'options']
    permission_classes = [AllowAny]
    serializer_class = TaskSerializer
    queryset = Task.objects.all() # Үүнийг заавал энд байлгах хэрэгтэй

    def get_queryset(self):
        # Энд self.queryset-ийг ашиглах нь илүү аюулгүй
        qs = super().get_queryset() 
        project_id = self.request.query_params.get('project_id')
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs

    # Илүү аюулгүй байдлын үүднээс шинээр даалгавар үүсэх үед дуудагдана
    def perform_create(self, serializer):
        serializer.save()