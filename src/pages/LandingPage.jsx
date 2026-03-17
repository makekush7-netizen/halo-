import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Building2, Users, Sparkles, User, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const MODES = [
  {
    title: 'Personal Meetings',
    desc: 'Create a link and meet instantly. No org setup, no friction, no downloads.',
    icon: <Users size={20} />,
    cta: 'Try it free',
    href: '/join?mode=create',
  },
  {
    title: 'Organization Mode',
    desc: 'Admins run multiple meetings, manage members, and move between rooms from the cockpit.',
    icon: <Building2 size={20} />,
    cta: 'Register organization',
    href: '/signup?org=1',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Create or register',
    desc: 'Start a personal meeting or register your organization to unlock cockpit control.',
  },
  {
    n: '02',
    title: 'Invite your people',
    desc: 'Share a link or assign members to sessions. Everyone joins in one click.',
  },
  {
    n: '03',
    title: 'Run sessions confidently',
    desc: 'Admins jump between meetings, keep teams aligned, and keep flow smooth.',
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [quickCode, setQuickCode] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const role = user?.role || 'member'
  const canAccessCockpit = role === 'admin' || role === 'co-admin'
  const displayName = user?.name || user?.email || user?.username || 'Halo User'
  const initials = displayName.slice(0, 2).toUpperCase()

  const handleQuickJoin = () => {
    const code = quickCode.trim().toUpperCase()
    if (!code) return
    navigate(`/join/${code}`)
  }

  const handleSignOut = async () => {
    await signOut()
    setProfileOpen(false)
    navigate('/')
  }

  return (
    <div className="landing">
      <div className="landing-noise" />

      <nav className="landing-nav">
        <div className="landing-logo">HALO</div>
        <div className="landing-nav-links">
          <button className="landing-link" onClick={() => document.getElementById('modes')?.scrollIntoView({ behavior: 'smooth' })}>Modes</button>
          <button className="landing-link" onClick={() => document.getElementById('cockpit')?.scrollIntoView({ behavior: 'smooth' })}>Cockpit</button>
          <button className="landing-link" onClick={() => document.getElementById('flow')?.scrollIntoView({ behavior: 'smooth' })}>Flow</button>
        </div>
        <div className="landing-nav-actions">
          {user ? (
            <>
              {canAccessCockpit ? (
                <button className="btn btn-lime" onClick={() => navigate('/cockpit')}>
                  Go to cockpit <ArrowRight size={16} />
                </button>
              ) : (
                <button className="btn btn-lime" onClick={() => navigate('/join?mode=create')}>
                  Create meeting <ArrowRight size={16} />
                </button>
              )}

              <div className="landing-profile-wrap">
                <button
                  className="landing-profile-trigger"
                  onClick={() => setProfileOpen((prev) => !prev)}
                >
                  <span className="landing-profile-avatar">{initials}</span>
                  <span className="landing-profile-name">{displayName}</span>
                </button>

                {profileOpen && (
                  <div className="landing-profile-menu glass-panel">
                    <div className="landing-profile-header">
                      <div className="landing-profile-title">{displayName}</div>
                      <div className="landing-profile-subtitle">{user?.email || 'Signed in'}</div>
                    </div>
                    <button className="landing-profile-item" onClick={() => navigate(canAccessCockpit ? '/cockpit' : '/join?mode=create')}>
                      <User size={14} /> {canAccessCockpit ? 'Open cockpit' : 'Open meetings'}
                    </button>
                    <button className="landing-profile-item landing-profile-item-danger" onClick={handleSignOut}>
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => navigate('/login')}>Sign in</button>
              <button className="btn btn-lime" onClick={() => navigate('/signup?org=1')}>
                Register organization
              </button>
            </>
          )}
        </div>
      </nav>

      <section className="landing-hero">
        <motion.div
          className="landing-hero-copy"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="landing-eyebrow">
            <Sparkles size={16} /> Clean meetings. Org control.
          </div>
          <h1 className="landing-title">
            Meetings that feel simple for people,
            <span className="text-lime"> powerful for organizations.</span>
          </h1>
          <p className="landing-lede">
            Halo gives you instant personal meetings and a full org cockpit to run multiple sessions at once.
            Built for teams that move fast and need clarity.
          </p>
          <div className="landing-cta-row">
            {user && !canAccessCockpit ? (
              <>
                <button className="btn btn-lime" onClick={() => navigate('/join?mode=create')}>
                  Create meeting
                </button>
                <button className="btn btn-ghost" onClick={() => navigate('/join')}>
                  Join with code
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-lime" onClick={() => navigate('/signup?org=1')}>
                  Register organization
                </button>
                <button className="btn btn-ghost" onClick={() => navigate('/join?mode=create')}>
                  Try it free
                </button>
              </>
            )}
          </div>
          <div className="landing-meta">
            No downloads. Works in browser. Share links in seconds.
          </div>

          <div className="landing-quick">
            <input
              className="input"
              placeholder="Enter a join code"
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
            />
            <button className="btn btn-ghost" onClick={handleQuickJoin}>Join</button>
            <button className="btn btn-lime" onClick={() => navigate('/join?mode=create')}>Create</button>
          </div>
        </motion.div>

        <motion.div
          className="landing-hero-media"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
        >
          <div className="landing-hero-image" />
          <div className="landing-hero-card">
            <div className="landing-hero-card-header">
              <span className="landing-pill">Live now</span>
              <span className="landing-card-muted">3 sessions active</span>
            </div>
            <div className="landing-card-grid">
              {['Growth sync', 'Design review', 'Mentor room'].map((title) => (
                <div key={title} className="landing-mini-card">
                  <div className="landing-mini-title">{title}</div>
                  <div className="landing-mini-row">
                    <span className="landing-mini-dot" /> 12 people
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section id="modes" className="landing-modes">
        <div className="landing-section-title">
          <p>Choose your mode</p>
          <h2>Personal meetings or full organization control.</h2>
        </div>
        <div className="landing-mode-grid">
          {MODES.map((mode) => (
            <motion.div
              key={mode.title}
              className="landing-mode-card"
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <div className="landing-mode-icon">{mode.icon}</div>
              <h3>{mode.title}</h3>
              <p>{mode.desc}</p>
              <button className="btn btn-ghost" onClick={() => navigate(mode.href)}>
                {mode.cta} <ArrowRight size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="cockpit" className="landing-cockpit">
        <div className="landing-cockpit-panel">
          <div>
            <p className="landing-tag">Organization cockpit</p>
            <h2>Move between meetings like a god.</h2>
            <p>
              Admins and co-admins manage rooms, assign members, and jump in instantly.
              Members only see the sessions they are assigned to.
            </p>
            <div className="landing-cockpit-actions">
              <button className="btn btn-lime" onClick={() => navigate('/signup?org=1')}>
                Create org cockpit
              </button>
              <button className="btn btn-ghost" onClick={() => navigate('/login?org=1')}>
                Admin sign in
              </button>
            </div>
          </div>
          <div className="landing-cockpit-image" />
        </div>
      </section>

      <section id="flow" className="landing-flow">
        <div className="landing-section-title">
          <p>Simple flow</p>
          <h2>Be live in three moves.</h2>
        </div>
        <div className="landing-flow-grid">
          {STEPS.map((step) => (
            <div key={step.n} className="landing-flow-card">
              <div className="landing-flow-number">{step.n}</div>
              <div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-final">
        <div className="landing-final-inner">
          <div>
            <h2>Build your Halo today.</h2>
            <p>Start with a personal meeting or launch your organization cockpit.</p>
          </div>
          <div className="landing-final-actions">
            <button className="btn btn-lime" onClick={() => navigate('/signup?org=1')}>
              Register organization
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/join?mode=create')}>
              Try it free
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
