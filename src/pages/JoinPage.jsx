import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, Plus, Copy, CheckCircle2 } from 'lucide-react'
import BackgroundParticles from '../components/BackgroundParticles.jsx'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export default function JoinPage() {
  const { roomCode: paramCode } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const query = new URLSearchParams(location.search)
  const queryMode = query.get('mode')
  const [mode, setMode] = useState(queryMode === 'create' ? 'create' : 'join')
  const [displayName, setDisplayName] = useState('')
  const [roomName, setRoomName] = useState('')
  const [roomCode, setRoomCode] = useState((paramCode || '').toUpperCase())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdRoom, setCreatedRoom] = useState(null)
  const [copied, setCopied] = useState(false)

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

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    if (!roomName.trim()) { setError('Please enter a meeting name.'); return }
    if (!displayName.trim()) { setError('Please enter your name.'); return }
    if (!API_BASE_URL) { setError('API URL not configured.'); return }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: roomName.trim(),
          hostDetails: { name: displayName.trim(), id: displayName.trim() },
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.roomId) throw new Error(data.error || 'Failed to create room')
      setCreatedRoom({ id: data.roomId, name: data.name || roomName.trim() })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!createdRoom) return
    navigator.clipboard.writeText(`${window.location.origin}/join/${createdRoom.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleJoinHost = () => {
    if (!createdRoom) return
    sessionStorage.setItem('halo_participant', JSON.stringify({ displayName: displayName.trim(), role: 'host' }))
    navigate(`/session/${createdRoom.id}`, { state: { id: createdRoom.id, name: createdRoom.name, role: 'host', displayName: displayName.trim() } })
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
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--accent-blue)' }}>
              {mode === 'join' ? <LogIn size={24} strokeWidth={1.5} /> : <Plus size={24} strokeWidth={1.5} />}
            </div>
            <h1 className="display-title" style={{ fontSize: 28, marginBottom: 6 }}>{mode === 'join' ? 'Join a Session' : 'Create a Meeting'}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {mode === 'join' ? 'Enter the room code shared by your host' : 'Spin up a personal meeting in seconds'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
            <button type="button" className={`btn ${mode === 'join' ? 'btn-lime' : 'btn-ghost'}`} onClick={() => setMode('join')} style={{ padding: '8px 14px', fontSize: 13 }}>
              Join
            </button>
            <button type="button" className={`btn ${mode === 'create' ? 'btn-lime' : 'btn-ghost'}`} onClick={() => setMode('create')} style={{ padding: '8px 14px', fontSize: 13 }}>
              Create
            </button>
          </div>

          {mode === 'join' ? (
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

              <button type="submit" className="btn btn-lime" style={{ width: '100%', padding: 16, fontSize: 15 }} disabled={loading}>
                {loading ? 'Joining...' : 'Join Session'}
              </button>
            </form>
          ) : (
            <form onSubmit={createdRoom ? (e) => e.preventDefault() : handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {!createdRoom && (
                <>
                  <div>
                    <label className="label">Meeting Name</label>
                    <input
                      required
                      className="input"
                      placeholder="e.g. Weekly Standup"
                      value={roomName}
                      onChange={e => setRoomName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Your Name</label>
                    <input
                      required
                      className="input"
                      placeholder="e.g. Kush"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                    />
                  </div>
                </>
              )}

              {createdRoom && (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px 20px', borderRadius: 12, fontSize: 22, letterSpacing: 6, fontWeight: 700, border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                    {createdRoom.id}
                  </div>
                  <button type="button" onClick={handleCopy} className="btn btn-ghost" style={{ width: '100%', padding: 14, gap: 8 }}>
                    {copied ? <CheckCircle2 size={16} color="var(--status-green)" /> : <Copy size={16} />}
                    {copied ? 'Copied to clipboard' : 'Copy invite link'}
                  </button>
                </div>
              )}

              {error && (
                <div style={{ background: 'var(--status-red-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: 'var(--status-red)' }}>
                  {error}
                </div>
              )}

              {!createdRoom ? (
                <button type="submit" className="btn btn-lime" style={{ width: '100%', padding: 16, fontSize: 15 }} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Meeting'}
                </button>
              ) : (
                <button type="button" className="btn btn-lime" style={{ width: '100%', padding: 16, fontSize: 15 }} onClick={handleJoinHost}>
                  Join as host
                </button>
              )}
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
            Need organization control?{' '}
            <span style={{ color: 'white', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/login?org=1')}>
              Sign in as admin
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
