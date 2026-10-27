import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import api, { getAccessToken } from './api'

function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [applyMessage, setApplyMessage] = useState('')
  const [applyError, setApplyError] = useState('')
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    let isCurrent = true

    const fetchJob = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await api.get(`/jobs/${id}/`)
        if (isCurrent) setJob(response.data)
      } catch (requestError) {
        console.error('Error fetching job details:', requestError)
        if (isCurrent) {
          setError('This job could not be loaded. It may have been removed.')
        }
      } finally {
        if (isCurrent) setLoading(false)
      }
    }

    fetchJob()
    return () => {
      isCurrent = false
    }
  }, [id])

  const applyForJob = async () => {
    if (!getAccessToken()) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    setApplyMessage('')
    setApplyError('')
    setApplying(true)

    try {
      await api.post('/apply/', { job_id: Number(id) })
      setApplyMessage('Your application has been submitted.')
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        navigate('/login', { state: { from: location.pathname } })
        return
      }

      const responseData = requestError.response?.data
      const detail =
        responseData?.detail ||
        responseData?.job_id?.[0] ||
        'We could not submit your application. Please try again.'
      setApplyError(detail)
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return <main className="job-detail-page"><div className="status-card">Loading job details…</div></main>
  }

  if (error || !job) {
    return (
      <main className="job-detail-page">
        <div className="status-card status-card--error" role="alert">
          {error || 'Job not found.'}
          <p><Link to="/">Return to job listings</Link></p>
        </div>
      </main>
    )
  }

  return (
    <main className="job-detail-page">
      <Link className="job-detail-back" to="/">← Back to jobs</Link>
      <article className="job-detail-card">
        <div className="job-detail-card__header">
          <span className="company-mark" aria-hidden="true">
            {(job.company || 'J').split(/\s+/).map((word) => word[0]).join('').slice(0, 2)}
          </span>
          <div>
            <p className="job-detail-card__company">{job.company}</p>
            <h1>{job.title}</h1>
          </div>
          {job.job_type && <span className="job-type-badge">{job.job_type}</span>}
        </div>

        <div className="job-detail-card__facts">
          {job.location && <span><strong>Location</strong>{job.location}</span>}
          {job.salary && <span><strong>Salary</strong>{job.salary}</span>}
          {job.posted_at && (
            <span>
              <strong>Posted</strong>
              {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(job.posted_at))}
            </span>
          )}
        </div>

        <section className="job-detail-card__description">
          <h2>About this role</h2>
          <p>{job.description}</p>
        </section>

        {applyMessage && <p className="application-feedback application-feedback--success" role="status">{applyMessage}</p>}
        {applyError && (
          <p className="application-feedback application-feedback--error" role="alert">
            {applyError}
            {applyError.toLowerCase().includes('resume') && (
              <> <Link to="/resume">Upload your resume</Link> and try again.</>
            )}
          </p>
        )}

        <div className="job-detail-card__actions">
          <button className="apply-button" type="button" onClick={applyForJob} disabled={applying}>
            {applying ? 'Submitting…' : getAccessToken() ? 'Apply for this job' : 'Log in to apply'}
            <span aria-hidden="true">→</span>
          </button>
          <Link className="outline-button" to="/">Browse more jobs</Link>
        </div>
      </article>
    </main>
  )
}

export default JobDetail
