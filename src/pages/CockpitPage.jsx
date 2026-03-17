import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import { Plus, RefreshCw, ArrowRight, Users, Clock, LogOut, Copy, CheckCircle2 } from 'lucide-react'
import BackgroundParticles from '../components/BackgroundParticles.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// Animated Spatial Card Component
function SpatialSessionCard({ session, onClick }) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 })
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 })
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-10deg', '10deg'])

  const handleMouseMove = (e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((e.clientX - rect.left - rect.width / 2) / rect.width)
    y.set((e.clientY - rect.top - rect.height / 2) / rect.height)
  }

  const handleMouseLeave = () => { x.set(0); y.set(0) }
  const attnColor = session.attention >= 70 ? 'var(--status-green)' : session.attention >= 50 ? 'var(--status-amber)' : 'var(--status-red)'

  return (
    <motion.div
      ref={ref}
      className="session-card-wrapper"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ rotateX, rotateY }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="glass-panel session-card" style={{ cursor: 'pointer' }}>
        <div className="session-card-preview" style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="badge badge-glass" style={{ color: 'var(--accent-blue)', background: 'rgba(59,130,246,0.1)' }}>
              <div className="live-dot" style={{ background: 'var(--accent-blue)', boxShadow: 'none' }} /> LIVE
            </div>
            <div className="badge badge-glass" style={{ color: attnColor, borderColor: `${attnColor}40` }}>
              {session.attention}% Attention
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: -8 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{
                width: 32, height: 32, borderRadius: 16, border: '2px solid var(--glass-bg)',
                background: `linear-gradient(135deg, hsl(${i * 60}, 70%, 50%), hsl(${i * 60 + 30}, 80%, 40%))`,
                marginLeft: i > 1 ? -12 : 0, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
              }} />
            ))}
            <div style={{
              width: 32, height: 32, borderRadius: 16, border: '2px solid var(--glass-bg)',
              background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
              marginLeft: -12, color: 'white'
            }}>
              +{session.participants - 5}
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 20px' }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
            {session.name}
            <ArrowRight size={18} color="var(--text-muted)" />
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Hosted by {session.host || 'Admin'}</p>
          <div style={{ display: 'flex', gap: 16, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} color="var(--accent-cyan)" /> {session.participants || 0}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} color="var(--accent-purple)" /> {session.duration || 0}m</div>
          </div>
          <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 20, overflow: 'hidden' }}>
            <motion.div 
              style={{ height: '100%', background: attnColor }} 
              initial={{ width: 0 }}
              animate={{ width: `${session.attention || 100}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function CreateRoomModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [roomName, setRoomName] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdRoom, setCreatedRoom] = useState(null)
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!API_BASE_URL) throw new Error("API URL not configured yet. Run deploy scripts.");
      
      const res = await fetch(`${API_BASE_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomName, 
          hostDetails: { name: user?.name, id: user?.username } 
        })
      })
      if (!res.ok) throw new Error("Failed to create room");
      const data = await res.json();
      
      setCreatedRoom({ id: data.roomId, name: data.name, host: data.host })
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`http://localhost:3000/join/${createdRoom.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleJoinHost = () => {
    sessionStorage.setItem('halo_participant', JSON.stringify({ displayName: user?.name || 'Admin', role: 'admin' }))
    navigate(`/session/${createdRoom.id}`, { state: createdRoom })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      />
      
      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-panel"
        style={{ width: '100%', maxWidth: 480, padding: 40, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(20,22,34,0.85)' }}
      >
        {!createdRoom ? (
          <form onSubmit={handleCreate}>
            <h2 className="display-title" style={{ fontSize: 24, marginBottom: 8 }}>Create Session</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>Give your session a name to generate an invite code.</p>
            
            <div style={{ marginBottom: 24 }}>
              <label className="label">Session Name</label>
              <input 
                required autoFocus 
                className="input" 
                placeholder="e.g. Weekly Standup" 
                value={roomName} onChange={e => setRoomName(e.target.value)} 
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-glass" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                {loading ? 'Generating...' : 'Create Room'}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, color: 'var(--status-green)' }}>
              <CheckCircle2 size={24} />
              <h2 className="display-title" style={{ fontSize: 24, background: 'none', WebkitTextFillColor: 'unset', color: 'white' }}>Session Created</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>Share this link or code with your participants.</p>
            
            <div style={{ marginBottom: 24 }}>
              <label className="label">Room Code</label>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px 20px', borderRadius: 12, fontSize: 24, letterSpacing: 8, fontWeight: 700, border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                {createdRoom.id}
              </div>
            </div>

            <button type="button" onClick={handleCopy} className="btn btn-glass" style={{ width: '100%', padding: 16, marginBottom: 16, gap: 10 }}>
              {copied ? <CheckCircle2 size={16} color="var(--status-green)" /> : <Copy size={16} />}
              {copied ? 'Copied to clipboard' : 'Copy Invite Link'}
            </button>

            <button type="button" onClick={handleJoinHost} className="btn btn-primary" style={{ width: '100%', padding: 16 }}>
              Join as Host <ArrowRight size={16} />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default function CockpitPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchRooms = async () => {
    setLoading(true)
    try {
      if (!API_BASE_URL) return;
      const res = await fetch(`${API_BASE_URL}/rooms`)
      const data = await res.json()
      // DynamoDB items are flat objects
      setSessions(data.rooms || [])
    } catch (e) {
      console.error("Failed to fetch rooms:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
    // Refresh every 30s
    const interval = setInterval(fetchRooms, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="page" style={{ position: 'relative', overflow: 'hidden' }}>
      <BackgroundParticles />
      <div className="aurora-bg" />

      {/* Nav */}
      <nav className="nav">
        <div className="logo-text" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>◎ Halo</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* User Profile Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: 20 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{user?.name || 'Admin'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email}</div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 18, background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14 }}>
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>

          <button className="btn btn-glass" onClick={handleSignOut} style={{ padding: '8px 16px', fontSize: 13, gap: 8 }}>
            <LogOut size={14} /> Sign Out
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> New Session
          </button>
        </div>
      </nav>

      <div style={{ paddingTop: 100, paddingInline: '5vw', position: 'relative', zIndex: 10, height: '100vh', overflowY: 'auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="display-title" style={{ fontSize: 32, marginBottom: 8 }}>Admin Cockpit</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 40, fontSize: 15 }}>Monitor 3 live sessions across your organization.</p>
        </motion.div>

        {/* Grid of Spatial Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>Loading active sessions...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 32, paddingBottom: 60 }}>
            {sessions.map((session, i) => (
              <motion.div key={session.roomId} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <SpatialSessionCard 
                  session={session} 
                  onClick={() => {
                    sessionStorage.setItem('halo_participant', JSON.stringify({ displayName: user?.name || 'Admin', role: 'admin' }))
                    navigate(`/session/${session.roomId}`, { state: session })
                  }}
                />
              </motion.div>
            ))}

            {/* Create New Room Card */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="glass-panel" 
              onClick={() => setIsModalOpen(true)}
              style={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: '2px dashed rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer',
                minHeight: 320, gap: 16
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: 28, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={24} color="var(--text-muted)" />
              </div>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Create New Session</span>
            </motion.div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && <CreateRoomModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); fetchRooms(); }} />}
      </AnimatePresence>
    </div>
  )
}
