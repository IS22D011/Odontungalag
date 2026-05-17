from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Project, Task
from apps.users.serializers import UserSerializer 
from apps.organizations.serializers import * 

User = get_user_model()

class TaskSerializer(serializers.ModelSerializer):
    # Харуулахдаа (GET) хэрэглэгчдийн дэлгэрэнгүйг харуулна
    assigned_to_details = UserSerializer(source='assigned_to', many=True, read_only=True)
    
    # Хадгалахдаа (POST/PATCH) ID-нуудын жагсаалт авна [1, 2]
    assigned_to = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=User.objects.all(), 
        required=False
    )

    class Meta:
        model = Task
        fields = [
            'id', 
            'project', 
            'title', 
            'description', 
            'status', 
            'priority',   
            'due_date',   
            'order', 
            'assigned_to', 
            'assigned_to_details',
            'created_at'
        ]
        
class ProjectSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    owner_name = serializers.ReadOnlyField(source='owner.username')
    members_details = UserSerializer(source='members', many=True, read_only=True)
    departments_details = DepartmentSerializer(source='departments', many=True, read_only=True)
    departments = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Department.objects.all(), 
        required=False
    )
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'owner', 'owner_name', 
            'members', 'members_details', 'departments', 'departments_details', # Нэмэгдсэн
            'status', 'start_date', 'end_date', 'tasks', 'created_at'
        ]