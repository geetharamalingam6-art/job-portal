from django.urls import path
from .views import RegisterView
from .views import JobView, JobDetailView
from .views import ResumeUploadView
from .views import ApplyView, AppliedJobsView
urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('jobs/', JobView.as_view(), name='job-list-create'),
    path('jobs/<int:pk>/', JobDetailView.as_view(), name='job-detail'),
    path('resume/', ResumeUploadView.as_view(), name='resume'),
    path('resume/upload/', ResumeUploadView.as_view(), name='resume-upload'),
    path('apply/', ApplyView.as_view(), name='apply-to-job'),
    path('my-applications/', AppliedJobsView.as_view(), name='applied-jobs'),
]
