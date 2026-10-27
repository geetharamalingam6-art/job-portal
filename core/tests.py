import tempfile

from django.contrib.auth.models import User
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase

from .models import Application, Job, Resume


class ApiRootTests(SimpleTestCase):
    def test_api_root_returns_available_endpoints(self):
        response = self.client.get('/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['message'], 'Job Portal API is running.')
        self.assertEqual(response.json()['endpoints']['jobs'], '/api/jobs/')


class ResumeAndApplicationApiTests(APITestCase):
    def setUp(self):
        self.media_directory = tempfile.TemporaryDirectory()
        self.settings_override = override_settings(MEDIA_ROOT=self.media_directory.name)
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)
        self.addCleanup(self.media_directory.cleanup)

        self.user = User.objects.create_user(
            username='applicant',
            email='applicant@example.com',
            password='test-password-123',
        )
        self.other_user = User.objects.create_user(
            username='another-applicant',
            password='test-password-456',
        )
        self.job = Job.objects.create(
            recruiter=self.other_user,
            title='Backend Developer',
            description='Build APIs.',
            company='Example Co',
            location='Remote',
            salary='$90k',
            job_type='Full-time',
        )
        access_token = str(RefreshToken.for_user(self.user).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

    def upload_resume(self, name='resume.pdf'):
        return self.client.post(
            reverse('resume-upload'),
            {'file': SimpleUploadedFile(name, b'resume contents', content_type='application/pdf')},
            format='multipart',
        )

    def test_resume_upload_and_replacement_are_private_to_authenticated_user(self):
        response = self.upload_resume()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['file_name'], 'resume.pdf')
        self.assertNotIn('file', response.data)
        self.assertEqual(Resume.objects.filter(user=self.user).count(), 1)

        get_response = self.client.get(reverse('resume'))
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        self.assertEqual(get_response.data['file_name'], 'resume.pdf')

        replacement = self.upload_resume('updated-resume.pdf')
        self.assertEqual(replacement.status_code, status.HTTP_200_OK)
        self.assertEqual(replacement.data['file_name'], 'updated-resume.pdf')
        self.assertEqual(Resume.objects.filter(user=self.user).count(), 1)
        self.assertFalse(Resume.objects.filter(user=self.other_user).exists())

    def test_resume_upload_rejects_unsupported_file_types(self):
        response = self.upload_resume('resume.exe')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('file', response.data)
        self.assertFalse(Resume.objects.filter(user=self.user).exists())

    def test_applying_requires_a_resume_and_duplicate_applications_are_rejected(self):
        application_url = reverse('apply-to-job')
        without_resume = self.client.post(
            application_url,
            {'job_id': self.job.id},
            format='json',
        )
        self.assertEqual(without_resume.status_code, status.HTTP_400_BAD_REQUEST)

        self.upload_resume()
        applied = self.client.post(
            application_url,
            {'job_id': self.job.id},
            format='json',
        )
        self.assertEqual(applied.status_code, status.HTTP_201_CREATED)
        self.assertEqual(applied.data['job']['title'], self.job.title)

        duplicate = self.client.post(
            application_url,
            {'job_id': self.job.id},
            format='json',
        )
        self.assertEqual(duplicate.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Application.objects.filter(applicant=self.user).count(), 1)

    def test_application_dashboard_returns_only_current_users_nested_jobs(self):
        self.upload_resume()
        self.client.post(
            reverse('apply-to-job'),
            {'job_id': self.job.id},
            format='json',
        )

        response = self.client.get(reverse('applied-jobs'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['job']['company'], self.job.company)
        self.assertIn('applied_at', response.data[0])

    def test_resume_application_and_dashboard_require_authentication(self):
        self.client.credentials()

        resume_response = self.client.get(reverse('resume'))
        apply_response = self.client.post(
            reverse('apply-to-job'),
            {'job_id': self.job.id},
            format='json',
        )
        dashboard_response = self.client.get(reverse('applied-jobs'))

        self.assertEqual(resume_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(apply_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(dashboard_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_endpoint_issues_access_token_for_authenticated_api_calls(self):
        self.client.credentials()
        token_response = self.client.post(
            '/api/token/',
            {'username': 'applicant', 'password': 'test-password-123'},
            format='json',
        )

        self.assertEqual(token_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', token_response.data)
        self.assertIn('refresh', token_response.data)

        refresh_response = self.client.post(
            '/api/token/refresh/',
            {'refresh': token_response.data['refresh']},
            format='json',
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh_response.data)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh_response.data['access']}"
        )
        dashboard_response = self.client.get(reverse('applied-jobs'))
        self.assertEqual(dashboard_response.status_code, status.HTTP_200_OK)
