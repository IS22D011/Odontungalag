from rest_framework import serializers
from .models import Department, Team, Invitation

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'organization']
        read_only_fields = ['organization']

class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ['id', 'name', 'department', 'organization', 'members']
        read_only_fields = ['organization']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'request' in self.context:
            user = self.context['request'].user
            # Зөвхөн тухайн байгууллагын хэлтсүүдийг сонгох боломжтой болгох
            self.fields['department'].queryset = Department.objects.filter(organization=user.organization)
            # Зөвхөн тухайн байгууллагын ажилчдыг сонгох боломжтой болгох
            from django.contrib.auth import get_user_model
            User = get_user_model()
            self.fields['members'].queryset = User.objects.filter(organization=user.organization)

class InvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = ['id', 'email', 'role', 'department', 'token', 'is_accepted']
        read_only_fields = ['token', 'is_accepted']