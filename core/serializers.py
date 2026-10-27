from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Application, Job, Resume


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('username', 'password', 'email')

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = '__all__'
        read_only_fields = ('recruiter',)


class ResumeSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True, required=True)
    file_name = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = ('id', 'file', 'file_name', 'uploaded_at', 'user')
        read_only_fields = ('id', 'file_name', 'uploaded_at', 'user')

    def get_file_name(self, obj):
        return obj.file.name.rsplit('/', 1)[-1] if obj.file else ''

    def validate_file(self, uploaded_file):
        allowed_extensions = {'.pdf', '.doc', '.docx'}
        extension = '.' + uploaded_file.name.rsplit('.', 1)[-1].lower() if '.' in uploaded_file.name else ''
        if extension not in allowed_extensions:
            raise serializers.ValidationError('Upload a PDF, DOC, or DOCX resume.')
        if uploaded_file.size > 10 * 1024 * 1024:
            raise serializers.ValidationError('Resume files must be 10 MB or smaller.')
        return uploaded_file


class ApplicationJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ('id', 'title', 'company', 'location', 'salary', 'job_type')


class ApplicationSerializer(serializers.ModelSerializer):
    job = ApplicationJobSerializer(read_only=True)
    job_id = serializers.PrimaryKeyRelatedField(
        source='job',
        queryset=Job.objects.all(),
        write_only=True,
    )

    class Meta:
        model = Application
        fields = ('id', 'job', 'job_id', 'applied_at')
        read_only_fields = ('id', 'job', 'applied_at')

    def validate_job_id(self, job):
        user = self.context['request'].user
        if Application.objects.filter(applicant=user, job=job).exists():
            raise serializers.ValidationError('You have already applied for this job.')
        return job
