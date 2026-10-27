import { Link } from 'react-router-dom'

function AuthIllustration() {
  return (
    <div className="auth-art" aria-hidden="true">
      <div className="auth-art__orbit auth-art__orbit--one" />
      <div className="auth-art__orbit auth-art__orbit--two" />
      <div className="auth-art__gear">✦</div>
      <div className="auth-art__resume auth-art__resume--back">
        <span />
        <span />
        <span />
      </div>
      <div className="auth-art__resume auth-art__resume--front">
        <span className="auth-art__avatar" />
        <span />
        <span />
        <span />
      </div>
      <div className="auth-art__person">
        <span className="auth-art__person-head" />
        <span className="auth-art__person-body" />
        <span className="auth-art__person-leg" />
      </div>
      <div className="auth-art__plant">
        <span />
        <span />
        <span />
      </div>
      <div className="auth-art__ground" />
    </div>
  )
}

function AuthLayout({ children, mode }) {
  const isLogin = mode === 'login'

  return (
    <div className="auth-page">
      <div className="auth-blue-band" />
      <header className="auth-header">
        <Link className="auth-brand" to="/" aria-label="JobTrack home">
          <span className="auth-brand__mark">J</span>
          <span>JobTrack</span>
        </Link>
        <nav className="auth-header__nav" aria-label="Main navigation">
          <Link to="/">Find jobs</Link>
          <Link to="/dashboard">Applications</Link>
          <Link to="/resume">My resume</Link>
        </nav>
        <Link
          className={`auth-header__action${isLogin ? ' auth-header__action--active' : ''}`}
          to={isLogin ? '/login' : '/register'}
        >
          {isLogin ? 'Log in' : 'Sign up'}
        </Link>
      </header>

      <main className="auth-main">
        <section className="auth-card" aria-label={isLogin ? 'Login' : 'Register'}>
          <div className="auth-form-panel">
            <p className="auth-greeting">{isLogin ? 'Hello again!' : 'Get started today'}</p>
            <h1>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
            <p className="auth-intro">
              {isLogin
                ? 'Sign in to continue your job search.'
                : 'Join JobTrack and discover your next opportunity.'}
            </p>
            {children}
            <p className="auth-switch">
              {isLogin ? 'Not a member?' : 'Already have an account?'}{' '}
              <Link to={isLogin ? '/register' : '/login'}>
                {isLogin ? 'Create an account' : 'Log in'}
              </Link>
            </p>
          </div>

          <aside className="auth-promo">
            <span className="auth-promo__eyebrow">Make your next move</span>
            <h2>{isLogin ? 'Your next great job is closer than you think.' : 'A better opportunity starts with one profile.'}</h2>
            <AuthIllustration />
            <p>
              Browse opportunities, keep your applications organized, and move
              forward with confidence.
            </p>
          </aside>
        </section>
      </main>

      <footer className="auth-footer">
        <div className="auth-footer__columns">
          <div>
            <h2>Job seekers</h2>
            <Link to="/">Browse jobs</Link>
            <Link to="/dashboard">My applications</Link>
            <Link to="/resume">Upload resume</Link>
          </div>
          <div>
            <h2>Your account</h2>
            <Link to="/login">Log in</Link>
            <Link to="/register">Create an account</Link>
          </div>
          <div>
            <h2>JobTrack</h2>
            <p>Find work that moves you forward.</p>
            <Link to="/">Explore opportunities</Link>
          </div>
        </div>
        <p className="auth-footer__copyright">© 2026 JobTrack. Your next chapter starts here.</p>
      </footer>
    </div>
  )
}

export default AuthLayout
