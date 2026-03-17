import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Video, LogIn, ArrowRight, Shield } from 'lucide-react'
import BackgroundParticles from '../components/BackgroundParticles.jsx'

export default function LobbyPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('join')
  const [roomName, setRoomName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState('participant')

  function handleCreate(e) {
    e.preventDefault()
    const id = Math.random().toString(36).substring(2, 8).toUpperCase()
    const room = { id, name: roomName || 'Untitled Session', host: displayName || 'Host', role }
    sessionStorage.setItem('halo_user', JSON.stringify({ displayName: displayName || 'Host', role }))
    navigate(`/session/${id}`, { state: room })
  }

  function handleJoin(e) {
    e.preventDefault()
    const code = roomCode.trim().toUpperCase()
    if (!code) return
    sessionStorage.setItem('halo_user', JSON.stringify({ displayName: displayName || 'Guest', role }))
    navigate(`/session/${code}`, { state: { id: code, name: `Room ${code}`, role } })
  }

  return (
    <div className="page" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Animated Aurora Background & Particles */}
      <BackgroundParticles />
      <div className="aurora-bg" />
      <div className="aurora-bg aurora-orb-3" />

      {/* Nav */}
      <nav className="nav">
        <div className="logo-text">◎ Halo</div>
        <button 
          className="btn btn-glass" 
          onClick={() => navigate('/cockpit')}
          style={{ padding: '8px 16px', fontSize: 13 }}
        >
          <Shield size={14} /> Admin Cockpit
        </button>
      </nav>

      <div style={{
        position: 'relative',
        zIndex: 10,
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 5vw',
        gap: '8vw'
      }}>
        
        {/* Left: Typography hooks */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ flex: 1, maxWidth: 600 }}
        >
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <div className="badge badge-glass" style={{ color: 'var(--accent-blue)' }}>
              <div className="live-dot" style={{ background: 'var(--accent-blue)' }} /> Spatial UI
            </div>
            <div className="badge badge-glass" style={{ color: 'var(--accent-cyan)' }}>Powered by AI</div>
          </div>

          <h1 className="display-title" style={{ fontSize: 'clamp(48px, 6vw, 72px)', lineHeight: 1.05, marginBottom: 24 }}>
            One cockpit.<br/>
            Infinite sessions.
          </h1>
          
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 480, marginBottom: 40 }}>
            Monitor, switch, and manage multiple real-time video rooms simultaneously from a single, unified command center.
          </p>

          <div style={{ display: 'flex', gap: 16 }}>
            <button className="btn btn-primary" onClick={() => setMode('create')} style={{ padding: '16px 32px', fontSize: 16 }}>
              Start Session <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>

        {/* Right: Glassmorphic Entry Form */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          style={{ width: 440 }}
        >
          <div className="glass-panel" style={{ 
            padding: 40, 
            background: 'rgba(25, 25, 30, 0.45)', // Lighter, tinted grey like Windows Dark mode
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            borderTop: '1px solid rgba(255, 255, 255, 0.2)', // Top highlight edge
            backdropFilter: 'blur(40px) saturate(150%)', // Extreme blur + saturation for Acrylic vibe
            WebkitBackdropFilter: 'blur(40px) saturate(150%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)' // Soft drop shadow
          }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 32, padding: 4, background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
              {['join', 'create'].map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8,
                    background: mode === m ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: mode === m ? 'white' : 'var(--text-muted)',
                    border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                    transition: '0.3s'
                  }}
                >
                  {m === 'join' ? 'Join' : 'Create'}
                </button>
              ))}
            </div>

            <form onSubmit={mode === 'create' ? handleCreate : handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="label">Your Name</label>
                <input required className="input" placeholder="e.g. Kush" value={displayName} onChange={e => setDisplayName(e.target.value)} />
              </div>

              {mode === 'create' ? (
                <div>
                  <label className="label">Session Name</label>
                  <input required className="input" placeholder="e.g. Physics Room" value={roomName} onChange={e => setRoomName(e.target.value)} />
                </div>
              ) : (
                <div>
                  <label className="label">Room Code</label>
                  <input required className="input" placeholder="6-LETTER CODE" maxLength={6} style={{ letterSpacing: 4, textTransform: 'uppercase' }} value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())} />
                </div>
              )}

              <div style={{ marginTop: 8 }}>
                <label className="label">Role (For Demo)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['participant', 'admin'].map(r => (
                    <button
                      key={r} type="button" onClick={() => setRole(r)}
                      style={{
                        flex: 1, padding: 10, borderRadius: 8, fontSize: 13, fontWeight: 500,
                        textTransform: 'capitalize', cursor: 'pointer',
                        border: role === r ? '1px solid var(--accent-blue)' : '1px solid var(--glass-border)',
                        background: role === r ? 'var(--accent-blue-glow)' : 'transparent',
                        color: role === r ? 'white' : 'var(--text-muted)',
                        transition: '0.2s'
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', marginTop: 12 }}>
                {mode === 'create' ? <><Video size={16} /> Enter Spatial Session</> : <><LogIn size={16} /> Join Session</>}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
