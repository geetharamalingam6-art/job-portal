import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from './api'

const jobTypes = ['Full-time', 'Part-time', 'Contract']
const workLocations = ['On-site', 'Remote', 'Hybrid']

function salaryAmount(value) {
  const matches = [...String(value || '').replace(/,/g, '').matchAll(/(\d+(?:\.\d+)?)\s*(k)?/gi)]
  const match = matches[0]
  if (!match) return null

  const amount = Number(match[1])
  const usesThousands = matches.some((item) => item[2])
  return Number.isFinite(amount) ? amount * (usesThousands ? 1000 : 1) : null
}

function matchesWorkLocation(location, workLocation) {
  const value = String(location || '').toLowerCase()
  if (workLocation === 'Remote') return value.includes('remote')
  if (workLocation === 'Hybrid') return value.includes('hybrid')
  return !value.includes('remote') && !value.includes('hybrid')
}

function formatDate(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function CompanyMark({ name, small = false }) {
  const initials = name
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)

  return (
    <span className={`company-mark${small ? ' company-mark--small' : ''}`} aria-hidden="true">
      {initials || 'J'}
    </span>
  )
}

function JobList() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [selectedTypes, setSelectedTypes] = useState([])
  const [selectedWorkLocations, setSelectedWorkLocations] = useState([])
  const [minimumSalary, setMinimumSalary] = useState(0)
  const [sortBy, setSortBy] = useState('recent')

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await api.get('/jobs/')
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results
        setJobs(Array.isArray(data) ? data : [])
      } catch (requestError) {
        console.error('Error fetching jobs:', requestError)
        setError('We could not load jobs right now. Please try again in a moment.')
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase()
    const locationQuery = location.trim().toLowerCase()

    const filtered = jobs.filter((job) => {
      const matchesSearch =
        !query ||
        `${job.title} ${job.company} ${job.description}`.toLowerCase().includes(query)
      const matchesLocation =
        !locationQuery || (job.location || '').toLowerCase().includes(locationQuery)
      const matchesType =
        selectedTypes.length === 0 || selectedTypes.includes(job.job_type)
      const matchesWorkMode =
        selectedWorkLocations.length === 0 ||
        selectedWorkLocations.some((workLocation) =>
          matchesWorkLocation(job.location, workLocation),
        )
      const amount = salaryAmount(job.salary)
      const matchesSalary =
        minimumSalary === 0 || amount === null || amount >= minimumSalary

      return matchesSearch && matchesLocation && matchesType && matchesWorkMode && matchesSalary
    })

    return filtered.sort((left, right) => {
      if (sortBy === 'alphabetical') {
        return String(left.title).localeCompare(String(right.title))
      }
      if (sortBy === 'salary') {
        return (salaryAmount(right.salary) ?? -1) - (salaryAmount(left.salary) ?? -1)
      }
      return new Date(right.posted_at || 0) - new Date(left.posted_at || 0)
    })
  }, [jobs, location, minimumSalary, search, selectedTypes, selectedWorkLocations, sortBy])

  const toggleJobType = (jobType) => {
    setSelectedTypes((current) =>
      current.includes(jobType)
        ? current.filter((type) => type !== jobType)
        : [...current, jobType],
    )
  }

  const clearFilters = () => {
    setSearch('')
    setLocation('')
    setSelectedTypes([])
    setSelectedWorkLocations([])
    setMinimumSalary(0)
    setSortBy('recent')
  }

  const toggleWorkLocation = (workLocation) => {
    setSelectedWorkLocations((current) =>
      current.includes(workLocation)
        ? current.filter((item) => item !== workLocation)
        : [...current, workLocation],
    )
  }

  return (
    <div className="jobs-page">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="JobTrack home">
          <span className="brand-mark">J</span>
          <span>JobTrack</span>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link className="site-nav__link site-nav__link--active" to="/">Find Jobs</Link>
          <Link className="site-nav__link" to="/dashboard">Applications</Link>
          <Link className="site-nav__link" to="/resume">My Resume</Link>
        </nav>
        <div className="site-header__account">
          <Link className="header-login" to="/login">Log in</Link>
          <Link className="header-register" to="/register">Sign up</Link>
        </div>
      </header>

      <main className="jobs-layout">
        <aside className="filter-panel" aria-label="Job filters">
          <div className="filter-panel__heading">
            <h2>Filter</h2>
            <button type="button" className="text-button" onClick={clearFilters}>Clear all</button>
          </div>

          <section className="filter-section">
            <h3>Sort by</h3>
            <div className="filter-options">
              {[
                ['Recently posted', 'recent'],
                ['A–Z', 'alphabetical'],
                ['Top salary', 'salary'],
              ].map(([label, value]) => (
                <label className="check-option" key={value}>
                  <input type="radio" name="sort-by" checked={sortBy === value} onChange={() => setSortBy(value)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="filter-section">
            <label className="filter-label" htmlFor="salary-filter">
              Minimum salary <strong>{minimumSalary === 0 ? 'Any' : `$${minimumSalary.toLocaleString()}`}</strong>
            </label>
            <input
              id="salary-filter"
              className="salary-range"
              type="range"
              min="0"
              max="200000"
              step="5000"
              value={minimumSalary}
              onChange={(event) => setMinimumSalary(Number(event.target.value))}
            />
            <div className="salary-range__labels"><span>Any</span><span>$200k+</span></div>
          </section>

          <section className="filter-section">
            <h3>Job type</h3>
            <div className="filter-options">
              {jobTypes.map((jobType) => (
                <label className="check-option" key={jobType}>
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(jobType)}
                    onChange={() => toggleJobType(jobType)}
                  />
                  <span>{jobType}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="filter-section">
            <h3>Work location</h3>
            <div className="filter-options">
              {workLocations.map((workLocation) => (
                <label className="check-option" key={workLocation}>
                  <input
                    type="checkbox"
                    checked={selectedWorkLocations.includes(workLocation)}
                    onChange={() => toggleWorkLocation(workLocation)}
                  />
                  <span>{workLocation}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="filter-section">
            <label className="filter-label" htmlFor="location-filter">Job location</label>
            <div className="location-input">
              <span aria-hidden="true">⌕</span>
              <input
                id="location-filter"
                type="search"
                placeholder="Search by location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </div>
          </section>

          <section className="filter-section filter-note">
            <p>Use the filters to narrow results by salary, job type, and location.</p>
          </section>
        </aside>

        <section className="job-results" aria-label="Job listings">
          <div className="search-banner">
            <div className="search-banner__copy">
              <span className="eyebrow">Your next opportunity starts here</span>
              <h1>Find your dream job here!</h1>
              <p>Explore the latest job openings and find a role that fits you.</p>
            </div>
            <form className="job-search" onSubmit={(event) => event.preventDefault()}>
              <span className="search-icon" aria-hidden="true">⌕</span>
              <input
                aria-label="Search jobs"
                type="search"
                placeholder="Search job title or company"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button type="submit">Search</button>
            </form>
          </div>

          <div className="results-heading">
            <div>
              <h2>Find your next opportunity</h2>
              <p>Showing <strong>{filteredJobs.length}</strong> {filteredJobs.length === 1 ? 'available job' : 'available jobs'}</p>
            </div>
            <label className="sort-control">
              Sort:
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="recent">Newest</option>
                <option value="alphabetical">A–Z</option>
                <option value="salary">Top salary</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="status-card">Finding opportunities for you…</div>
          ) : error ? (
            <div className="status-card status-card--error" role="alert">{error}</div>
          ) : filteredJobs.length === 0 ? (
            <div className="status-card">
              <h2>No jobs found</h2>
              <p>Try changing your search or clearing the filters.</p>
              <button type="button" className="outline-button" onClick={clearFilters}>Clear filters</button>
            </div>
          ) : (
            <div className="job-list">
              {filteredJobs.map((job) => (
                <article className="job-card" key={job.id}>
                  <Link
                    className="job-card__main"
                    to={`/jobs/${job.id}`}
                    aria-label={`View details for ${job.title} at ${job.company}`}
                  >
                  <div className="job-card__top">
                    <CompanyMark name={job.company || 'Company'} />
                    <div className="job-card__identity">
                      <h3>{job.title}</h3>
                      <p>{job.company}</p>
                    </div>
                    {job.job_type && <span className="job-type-badge">{job.job_type}</span>}
                  </div>

                  <div className="job-card__meta">
                    {job.job_type && <span><span aria-hidden="true">◷</span>{job.job_type}</span>}
                    {job.location && <span><span aria-hidden="true">⌖</span>{job.location}</span>}
                    {formatDate(job.posted_at) && <span className="job-card__date">{formatDate(job.posted_at)}</span>}
                  </div>

                  {job.description && <p className="job-card__description">{job.description}</p>}
                  </Link>

                  <div className="job-card__footer">
                    <span className="salary-value">{job.salary || 'Salary not specified'}</span>
                    <Link className="apply-button" to={`/jobs/${job.id}`}>View job <span aria-hidden="true">→</span></Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}

export default JobList
