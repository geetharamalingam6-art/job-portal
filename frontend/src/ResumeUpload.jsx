import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getAccessToken } from './api'

function ResumeUpload() {
  const [resume, setResume] = useState(null)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!getAccessToken()) {
      return
    }

    const loadResume = async () => {
      try {
        const response = await api.get('/resume/')
        setResume(response.data)
      } catch (requestError) {
        console.error('Could not load resume information:', requestError)
        setError(
          requestError.response?.status === 401
            ? 'Your session has expired. Please log in again.'
            : 'Could not load your resume information. Please try again.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadResume()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!file) {
      setError('Choose a PDF, DOC, or DOCX file to upload.')
      return
    }

    setError('')
    setSuccess('')
    setSubmitting(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post('/resume/upload/', formData)
      setResume(response.data)
      setFile(null)
      event.currentTarget.reset()
      setSuccess('Your resume has been saved and is ready to use when applying.')
    } catch (requestError) {
      console.error('Resume upload failed:', requestError)
      const responseData = requestError.response?.data
      setError(
        responseData?.file?.[0] ||
        responseData?.detail ||
        (requestError.response?.status === 401
          ? 'Your session has expired. Please log in again.'
          : 'Resume upload failed. Please check the file and try again.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!getAccessToken()) {
    return (
      <main className="account-page">
        <section className="account-card">
          <h1>Upload your resume</h1>
          <p>Log in to securely upload and manage your resume.</p>
          <Link className="apply-button" to="/login" state={{ from: '/resume' }}>Log in to continue</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="account-page">
      <section className="account-card">
        <span className="account-card__eyebrow">Your profile</span>
        <h1>Resume</h1>
        <p className="account-card__intro">
          Upload a PDF, DOC, or DOCX file (up to 10 MB). Your resume is private
          and will be attached when you apply for a job.
        </p>

        {loading ? (
          <p className="account-status">Checking your saved resume…</p>
        ) : (
          <>
            {resume && (
              <div className="resume-current">
                <span className="resume-current__icon" aria-hidden="true">PDF</span>
                <span>
                  <strong>{resume.file_name}</strong>
                  <small>
                    Uploaded {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(resume.uploaded_at))}
                  </small>
                </span>
                <span className="resume-current__check" aria-label="Resume saved">✓</span>
              </div>
            )}

            <form className="resume-form" onSubmit={handleSubmit}>
              <label className="resume-file-picker">
                <span className="resume-file-picker__icon" aria-hidden="true">↑</span>
                <strong>{file ? file.name : resume ? 'Choose a replacement file' : 'Choose your resume'}</strong>
                <small>PDF, DOC, or DOCX · Maximum 10 MB</small>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) => {
                    setFile(event.target.files?.[0] || null)
                    setError('')
                    setSuccess('')
                  }}
                />
              </label>

              {error && (
                <p className="application-feedback application-feedback--error" role="alert">
                  {error}
                  {error.toLowerCase().includes('expired') && <> <Link to="/login">Log in</Link>.</>}
                </p>
              )}
              {success && <p className="application-feedback application-feedback--success" role="status">{success}</p>}

              <button className="apply-button resume-submit" type="submit" disabled={submitting || loading}>
                {submitting ? 'Uploading…' : resume ? 'Replace resume' : 'Upload resume'}
                <span aria-hidden="true">→</span>
              </button>
            </form>
          </>
        )}
        <Link className="account-back-link" to="/dashboard">Go to my applications</Link>
      </section>
    </main>
  )
}

export default ResumeUpload
