from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListCreateAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework import generics, parsers, status
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.views import APIView

from .models import Job, Resume, Application
from .serializers import UserSerializer, JobSerializer, ResumeSerializer, ApplicationSerializer
from .filters import JobFilter


class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class JobView(ListCreateAPIView):
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_class = JobFilter

    def get_queryset(self):
        return Job.objects.all().order_by('-posted_at')

    def perform_create(self, serializer):
        serializer.save(recruiter=self.request.user)


class JobDetailView(RetrieveAPIView):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class ResumeUploadView(generics.CreateAPIView):
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get(self, request, *args, **kwargs):
        resume = Resume.objects.filter(user=request.user).first()
        if resume is None:
            return Response(None, status=status.HTTP_200_OK)
        return Response(self.get_serializer(resume).data)

    def post(self, request, *args, **kwargs):
        resume = Resume.objects.filter(user=request.user).first()
        old_file = resume.file if resume else None
        serializer = self.get_serializer(
            instance=resume,
            data=request.data,
            partial=resume is not None,
        )
        serializer.is_valid(raise_exception=True)
        saved_resume = serializer.save(user=request.user)

        if old_file and old_file.name != saved_resume.file.name:
            old_file.storage.delete(old_file.name)

        return Response(
            self.get_serializer(saved_resume).data,
            status=status.HTTP_200_OK if resume else status.HTTP_201_CREATED,
        )


class ApplyView(generics.CreateAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        resume = Resume.objects.filter(user=self.request.user).first()
        if resume is None:
            raise ValidationError({'detail': 'Please upload your resume before applying.'})
        serializer.save(applicant=self.request.user, resume=resume)


class AppliedJobsView(generics.ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Application.objects.filter(applicant=self.request.user)
            .select_related('job')
            .order_by('-applied_at')
        )
