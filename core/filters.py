import django_filters
from .models import Job
class JobFilter(django_filters.FilterSet):
# Case-insensitive search on title and description
 title = django_filters.CharFilter(lookup_expr='icontains')
description = django_filters.CharFilter(lookup_expr='icontains')
class Meta:
 model = Job
# These are the fields the API can filter on
fields = ['category', 'location', 'job_type', 'title', 'description']