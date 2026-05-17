from django.contrib import admin
from .models import Organization, Invitation

admin.site.register(Organization)
admin.site.register(Invitation)