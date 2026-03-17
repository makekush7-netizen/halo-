import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn } from 'lucide-react'
import BackgroundParticles from '../components/BackgroundParticles.jsx'

export default function JoinPage() {
  const { roomCode: paramCode } = useParams()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [roomCode, setRoomCode] = useState((paramCode || '').toUpperCase())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin(e) {
    e.preventDefault()
    setError('')
    const code = roomCode.trim().toUpperCase()
    if (code.length < 4) { setError('Please enter a valid room code.'); return }
    if (!displayName.trim()) { setError('Please enter your name.'); return }

    setLoading(true)
    // TODO: call halo-get-room API to validate room code exists before joining
    sessionStorage.setItem('halo_participant', JSON.stringify({ displayName: displayName.trim(), role: 'participant' }))
    navigate(`/session/${code}`, { state: { id: code, name: `Room ${code}`, role: 'participant', displayName: displayName.trim() } })
  }

  return (
    <div className="page" style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <BackgroundParticles />
      <div className="aurora-bg" />

      <div style={{ position: 'absolute', top: 32, left: 40 }}>
        <div className="logo-text" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>◎ Halo</div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ width: 440, position: 'relative', zIndex: 10 }}
      >
        <div className="glass-panel" style={{
          padding: 48,
          background: 'rgba(20, 22, 34, 0.55)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderTop: '1px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(40px) saturate(150%)',
          WebkitBackdropFilter: 'blur(40px) saturate(150%)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--accent-blue)' }}>
              <LogIn size={24} strokeWidth={1.5} />
            </div>
            <h1 className="display-title" style={{ fontSize: 28, marginBottom: 8 }}>Join a Session</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Enter the room code shared by your host</p>
          </div>

          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="label">Room Code</label>
              <input
                required autoFocus
                className="input"
                placeholder="e.g. MATH01"
                maxLength={8}
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                style={{ letterSpacing: 6, fontSize: 20, textAlign: 'center', textTransform: 'uppercase' }}
              />
            </div>
            <div>
              <label className="label">Your Name</label>
              <input
                required
                className="input"
                placeholder="e.g. Aryan"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
            </div>

            {error && (
              <div style={{ background: 'var(--status-red-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: 'var(--status-red)' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 16, fontSize: 15 }} disabled={loading}>
              {loading ? 'Joining...' : 'Join Session'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: 'var(--text-secondary)' }}>
            Want to host?{' '}
            <span style={{ color: 'white', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/login')}>
              Sign in as admin
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
