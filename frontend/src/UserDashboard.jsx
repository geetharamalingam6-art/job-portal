import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getAccessToken } from './api'

function UserDashboard() {
  const [applications, setApplications] = useState([])
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const authenticated = Boolean(getAccessToken())

  useEffect(() => {
    if (!authenticated) {
      return
    }

    const loadDashboard = async () => {
      try {
        const [applicationsResponse, resumeResponse] = await Promise.all([
          api.get('/my-applications/'),
          api.get('/resume/'),
        ])
        const data = applicationsResponse.data
        setApplications(Array.isArray(data) ? data : data.results || [])
        setResume(resumeResponse.data)
      } catch (requestError) {
        console.error('Failed to load your dashboard:', requestError)
        setError(
          requestError.response?.status === 401
            ? 'Your session has expired. Please log in again.'
            : 'We could not load your applications. Please try again.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [authenticated])

  if (!authenticated) {
    return (
      <main className="account-page">
        <section className="account-card">
          <h1>My applications</h1>
          <p>Log in to view your application history and resume.</p>
          <Link className="apply-button" to="/login" state={{ from: '/dashboard' }}>Log in to continue</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="account-page account-page--wide">
      <section className="account-heading">
        <span className="account-card__eyebrow">Your job search</span>
        <h1>My applications</h1>
        <p>Keep track of the roles you have applied for.</p>
      </section>

      <section className="dashboard-summary">
        <article className="dashboard-summary__card">
          <span className="dashboard-summary__icon" aria-hidden="true">▤</span>
          <div>
            <strong>{loading ? '…' : applications.length}</strong>
            <span>Applications</span>
          </div>
        </article>
        <article className="dashboard-summary__card">
          <span className="dashboard-summary__icon" aria-hidden="true">✓</span>
          <div>
            <strong>{resume ? 'Ready' : 'Needed'}</strong>
            <span>Resume status</span>
          </div>
          <Link to="/resume">{resume ? 'Manage' : 'Upload'}</Link>
        </article>
      </section>

      {loading ? (
        <div className="account-status">Loading your applications…</div>
      ) : error ? (
        <div className="application-feedback application-feedback--error" role="alert">
          {error} {error.toLowerCase().includes('expired') && <Link to="/login">Log in again</Link>}
        </div>
      ) : applications.length === 0 ? (
        <section className="account-empty">
          <span className="account-empty__icon" aria-hidden="true">⌕</span>
          <h2>No applications yet</h2>
          <p>When you apply for a role, you’ll see its status here.</p>
          {!resume && <p className="account-empty__hint">Upload a resume first so it’s ready when you apply.</p>}
          <div className="account-empty__actions">
            {!resume && <Link className="outline-button" to="/resume">Upload resume</Link>}
            <Link className="apply-button" to="/">Find jobs</Link>
          </div>
        </section>
      ) : (
        <section className="application-list">
          {applications.map((application) => (
            <article className="application-card" key={application.id}>
              <div className="application-card__company-mark" aria-hidden="true">
                {(application.job?.company || 'J')
                  .split(/\s+/)
                  .map((word) => word[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div className="application-card__details">
                <h2>{application.job?.title || 'Job application'}</h2>
                <p>{application.job?.company || 'Company'}{application.job?.location ? ` · ${application.job.location}` : ''}</p>
                <span>
                  Applied {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(application.applied_at))}
                </span>
              </div>
              <span className="application-status">Submitted</span>
              {application.job?.id && (
                <Link className="application-card__link" to={`/jobs/${application.job.id}`} aria-label={`View ${application.job.title}`}>
                  →
                </Link>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  )
}

export default UserDashboard
