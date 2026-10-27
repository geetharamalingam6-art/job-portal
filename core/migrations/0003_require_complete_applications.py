import core.models
from django.db import migrations, models
import django.db.models.deletion


def require_complete_legacy_records(apps, schema_editor):
    Application = apps.get_model('core', 'Application')
    Resume = apps.get_model('core', 'Resume')
    database = schema_editor.connection.alias

    incomplete_applications = Application.objects.using(database).filter(
        models.Q(job__isnull=True)
        | models.Q(resume__isnull=True)
        | models.Q(applied_at__isnull=True)
    ).count()
    incomplete_resumes = Resume.objects.using(database).filter(
        models.Q(file__isnull=True) | models.Q(uploaded_at__isnull=True)
    ).count()

    if incomplete_applications or incomplete_resumes:
        raise RuntimeError(
            'Cannot complete the core migration because existing Application '
            f'records missing job, resume, or applied_at: {incomplete_applications}; '
            'existing Resume records missing file or uploaded_at: '
            f'{incomplete_resumes}. Back up and resolve these records before '
            'running migrate again.'
        )


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_application_applied_at_application_job_and_more'),
    ]

    operations = [
        migrations.RunPython(
            require_complete_legacy_records,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name='application',
            name='applied_at',
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AlterField(
            model_name='application',
            name='job',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                to='core.job',
            ),
        ),
        migrations.AlterField(
            model_name='application',
            name='resume',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                to='core.resume',
            ),
        ),
        migrations.AlterField(
            model_name='resume',
            name='file',
            field=models.FileField(upload_to=core.models.user_directory_path),
        ),
        migrations.AlterField(
            model_name='resume',
            name='uploaded_at',
            field=models.DateTimeField(auto_now_add=True),
        ),
    ]
