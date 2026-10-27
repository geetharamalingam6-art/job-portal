from django.contrib import admin
from django.contrib.auth.models import User
from .models import Job, Application


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'location', 'posted_at', 'is_approved')
    list_filter = ('is_approved', 'posted_at', 'location')
    search_fields = ('title', 'company', 'description')
    actions = ['approve_jobs']

    @admin.action(description='Approve selected jobs')
    def approve_jobs(self, request, queryset):
        queryset.update(is_approved=True)


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('applicant', 'job', 'applied_at')
    list_filter = ('job__company', 'applied_at')


# Optional: Customize the User admin to see related info
admin.site.unregister(User)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'is_staff', 'date_joined')
