from django.contrib import admin
from .models import Profile,Follow

# Register your models here.
admin.site.site_header = "VIBES ADMIN PANEL"
admin.site.register(Profile)
admin.site.register(Follow)