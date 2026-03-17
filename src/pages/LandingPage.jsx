import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Eye, Brain, LayoutDashboard, RadioTower, ChevronRight } from 'lucide-react'
import BackgroundParticles from '../components/BackgroundParticles.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const FEATURES = [
  {
    icon: <LayoutDashboard size={22} strokeWidth={1.5} />,
    color: '#3b82f6',
    title: 'Multi-Session Cockpit',
    desc: 'Monitor every live session in real time from a single unified dashboard. Live attention scores, participant counts, and instant alerts.',
  },
  {
    icon: <Brain size={22} strokeWidth={1.5} />,
    color: '#8b5cf6',
    title: 'AI Attention Scoring',
    desc: 'AWS AI analyzes behavioral signals from every participant and scores their attention level per second, so you know exactly who is engaged.',
  },
  {
    icon: <RadioTower size={22} strokeWidth={1.5} />,
    color: '#06b6d4',
    title: 'Live AI Captions',
    desc: 'Real-time subtitles transcribed with AWS Transcribe Streaming — blazing fast, low latency, and accurate across accents.',
  },
  {
    icon: <Zap size={22} strokeWidth={1.5} />,
    color: '#f59e0b',
    title: 'Late Joiner AI Summary',
    desc: 'Joined late? Halo generates an instant summary of what was discussed so you can catch up without interrupting the session.',
  },
  {
    icon: <Eye size={22} strokeWidth={1.5} />,
    color: '#10b981',
    title: 'Post-Session Report',
    desc: 'When a session ends, AI generates a complete structured report: topics covered, action items, participation breakdown, and follow-ups.',
  },
]

const STEPS = [
  { n: '01', title: 'Create a Session', desc: 'Sign in, click Create Session, give it a name. Halo generates a 6-letter room code and shareable invite link in seconds.' },
  { n: '02', title: 'Send the Link', desc: 'Share the room code or invite link via WhatsApp, Slack, email — participants join instantly, no account needed.' },
  { n: '03', title: 'Monitor & Analyse', desc: 'Watch your cockpit in real time. Session ends? Download the AI-generated report with one click.' },
]

function FadeIn({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden', background: 'var(--bg-void)' }}>
      <BackgroundParticles />
      <div className="aurora-bg" />

      {/* ---- NAV ---- */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 5vw', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', background: 'rgba(3,7,18,0.6)' }}>
        <div className="logo-text">◎ Halo</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {user ? (
            <button className="btn btn-primary" onClick={() => navigate('/cockpit')}>
              Go to Cockpit <ArrowRight size={14} />
            </button>
          ) : (
            <>
              <button className="btn btn-glass" onClick={() => navigate('/login')}>Sign In</button>
              <button className="btn btn-primary" onClick={() => navigate('/signup')}>Get Started</button>
            </>
          )}
        </div>
      </nav>

      {/* ---- HERO ---- */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 5vw 80px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 840 }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
            <div className="badge badge-glass" style={{ margin: '0 auto 24px', color: 'var(--accent-cyan)' }}>
              <div className="live-dot" style={{ background: 'var(--accent-cyan)' }} /> Built for Real-Time AI Collaboration
            </div>

            <h1 className="display-title" style={{ fontSize: 'clamp(44px, 7vw, 88px)', lineHeight: 1.02, marginBottom: 28 }}>
              One cockpit.<br />
              <span className="text-gradient">Infinite sessions.</span>
            </h1>

            <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 600, margin: '0 auto 48px' }}>
              Halo lets you host, monitor, and analyse unlimited real-time video sessions simultaneously — with live AI captions, attention scoring, and automated post-session reports.
            </p>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" style={{ padding: '18px 36px', fontSize: 16 }} onClick={() => navigate(user ? '/cockpit' : '/signup')}>
                Start for Free <ArrowRight size={16} />
              </button>
              <button className="btn btn-glass" style={{ padding: '18px 36px', fontSize: 16 }} onClick={() => navigate('/join')}>
                Join a Session
              </button>
            </div>
          </motion.div>

          {/* Preview screenshot / mock */}
          <motion.div 
            initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 20 }} transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
            style={{ marginTop: 80, padding: 4, background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', borderRadius: 24 }}
          >
            <div className="glass-panel" style={{ borderRadius: 20, overflow: 'hidden', height: 380, background: 'rgba(11,15,25,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Mini cockpit mock */}
              <div style={{ width: '90%', height: '80%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div className="badge badge-red" style={{ background: 'rgba(239,68,68,0.1)' }}><div className="live-dot" />LIVE</div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>3 active sessions</span>
                </div>
                <div style={{ display: 'flex', gap: 16, flex: 1 }}>
                  {['Mathematics Cl.10', 'History Cl. 12', 'Science Cl.9'].map((name, i) => (
                    <div key={name} className="glass-panel" style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{name}</span>
                        <div className="badge badge-glass" style={{ fontSize: 11, padding: '2px 8px' }}>{[82, 54, 91][i]}% attn</div>
                      </div>
                      <div style={{ height: 80, background: 'rgba(0,0,0,0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', gap: -8 }}>
                          {[1,2,3].map(j => (
                            <div key={j} style={{ width: 24, height: 24, borderRadius: 12, background: `hsl(${j*60+i*40}, 70%, 55%)`, marginLeft: j > 1 ? -8 : 0, border: '2px solid var(--bg-deep)' }} />
                          ))}
                        </div>
                      </div>
                      <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                        <div style={{ height: '100%', background: [82,54,91][i] > 70 ? 'var(--status-green)' : 'var(--status-amber)', width: `${[82,54,91][i]}%`, borderRadius: 2 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---- FEATURES ---- */}
      <section style={{ padding: '80px 5vw', position: 'relative', zIndex: 10, maxWidth: 1200, margin: '0 auto' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="badge badge-glass" style={{ margin: '0 auto 16px', display: 'inline-flex' }}>Features</div>
            <h2 className="display-title" style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}>Everything you need</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: 16, fontSize: 17 }}>Powerful AI features that work out of the box.</p>
          </div>
        </FadeIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.08}>
              <div className="glass-panel" style={{ padding: 32, height: '100%' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${f.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, color: f.color }}>
                  {f.icon}
                </div>
                <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ---- HOW IT WORKS ---- */}
      <section style={{ padding: '80px 5vw', position: 'relative', zIndex: 10, maxWidth: 900, margin: '0 auto' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="badge badge-glass" style={{ margin: '0 auto 16px', display: 'inline-flex' }}>How it works</div>
            <h2 className="display-title" style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}>Up and running<br />in 3 steps</h2>
          </div>
        </FadeIn>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
          {/* Connecting line */}
          <div style={{ position: 'absolute', left: 31, top: 64, bottom: 64, width: 2, background: 'linear-gradient(to bottom, var(--accent-blue), var(--accent-purple))', opacity: 0.3 }} />
          {STEPS.map((s, i) => (
            <FadeIn key={s.n} delay={i * 0.1}>
              <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
                <div style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(59,130,246,0.1)', border: '2px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--accent-blue)' }}>
                  {s.n}
                </div>
                <div className="glass-panel" style={{ padding: 28, flex: 1 }}>
                  <h3 style={{ fontWeight: 600, fontSize: 20, marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ---- CTA ---- */}
      <section style={{ padding: '80px 5vw 120px', position: 'relative', zIndex: 10, textAlign: 'center' }}>
        <FadeIn>
          <div className="glass-panel" style={{ maxWidth: 700, margin: '0 auto', padding: '64px 48px' }}>
            <h2 className="display-title" style={{ fontSize: 'clamp(32px, 4vw, 48px)', marginBottom: 16 }}>Ready to run your first session?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 40, fontSize: 16 }}>Free to get started. No credit card required.</p>
            <button className="btn btn-primary" style={{ padding: '18px 48px', fontSize: 16 }} onClick={() => navigate(user ? '/cockpit' : '/signup')}>
              {user ? 'Open Cockpit' : 'Create Free Account'} <ArrowRight size={16} />
            </button>
          </div>
        </FadeIn>
      </section>

      {/* ---- FOOTER ---- */}
      <footer style={{ borderTop: '1px solid var(--glass-border)', padding: '32px 5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <div className="logo-text" style={{ fontSize: 18 }}>◎ Halo</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>© 2025 Halo. Built with React + AWS.</p>
      </footer>
    </div>
  )
}
