import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import { Plus, RefreshCw, ArrowRight, Users, Clock, LogOut, Copy, CheckCircle2, Filter, Eraser } from 'lucide-react'
import BackgroundParticles from '../components/BackgroundParticles.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const STORAGE_MEMBERS_KEY = 'halo_org_members'
const STORAGE_ASSIGNMENTS_KEY = 'halo_room_assignments'

function loadMembers(user) {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_MEMBERS_KEY) || '[]')
    if (stored.length > 0) return stored
  } catch {
    // Ignore parse errors and fall back to defaults.
  }
  return [
    {
      id: user?.userId || 'owner',
      name: user?.name || 'Org Admin',
      email: user?.email || 'admin@halo.com',
      role: user?.role || 'admin',
    },
  ]
}

function saveMembers(members) {
  sessionStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify(members))
}

function loadAssignments() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_ASSIGNMENTS_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveAssignments(assignments) {
  sessionStorage.setItem(STORAGE_ASSIGNMENTS_KEY, JSON.stringify(assignments))
}

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

function CreateRoomModal({ isOpen, onClose, orgMembers }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [roomName, setRoomName] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdRoom, setCreatedRoom] = useState(null)
  const [copied, setCopied] = useState(false)
  const [assignedEmails, setAssignedEmails] = useState(() => new Set(
    (orgMembers || []).filter((member) => member.role === 'member').map((member) => member.email)
  ))

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
      const assignments = loadAssignments()
      assignments[data.roomId] = Array.from(assignedEmails)
      saveAssignments(assignments)
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${createdRoom.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleJoinHost = () => {
    sessionStorage.setItem('halo_participant', JSON.stringify({ displayName: user?.name || 'Admin', role: 'admin' }))
    navigate(`/session/${createdRoom.id}`, { state: createdRoom })
  }

  const toggleAssign = (email) => {
    setAssignedEmails((prev) => {
      const next = new Set(prev)
      if (next.has(email)) next.delete(email)
      else next.add(email)
      return next
    })
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
            
            {orgMembers?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <label className="label">Assign members (optional)</label>
                <div style={{ display: 'grid', gap: 8, maxHeight: 160, overflow: 'auto', paddingRight: 6 }}>
                  {orgMembers.filter((member) => member.role === 'member').map((member) => (
                    <label key={member.id} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={assignedEmails.has(member.email)}
                        onChange={() => toggleAssign(member.email)}
                      />
                      <span>{member.name} · {member.email}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

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
            {assignedEmails.size > 0 && (
              <div style={{ marginBottom: 18, fontSize: 12, color: 'var(--text-muted)' }}>
                Assigned members: {assignedEmails.size}
              </div>
            )}
            
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
  const [members, setMembers] = useState(() => loadMembers(user))
  const [memberForm, setMemberForm] = useState({ name: '', email: '', role: 'member' })
  const [mySessionsOnly, setMySessionsOnly] = useState(true)
  const role = user?.role || 'member'
  const isAdmin = role === 'admin' || role === 'co-admin'

  const fetchRooms = async () => {
    setLoading(true)
    try {
      if (!API_BASE_URL) {
        // No API configured yet — show empty state instead of infinite spinner
        setSessions([])
        return
      }
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

  useEffect(() => {
    if (user) {
      const initial = loadMembers(user)
      setMembers(initial)
      saveMembers(initial)
    }
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const handleMemberField = (field) => (e) => {
    setMemberForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleAddMember = (e) => {
    e.preventDefault()
    if (!memberForm.name.trim() || !memberForm.email.trim()) return
    const next = [
      ...members,
      {
        id: `${Date.now()}`,
        name: memberForm.name.trim(),
        email: memberForm.email.trim(),
        role: memberForm.role,
      },
    ]
    setMembers(next)
    saveMembers(next)
    setMemberForm({ name: '', email: '', role: 'member' })
  }

  const handlePromote = (memberId) => {
    const next = members.map((member) => {
      if (member.id !== memberId) return member
      if (member.role === 'co-admin') return member
      return { ...member, role: 'co-admin' }
    })
    setMembers(next)
    saveMembers(next)
  }

  const handleResetLocalTestData = () => {
    sessionStorage.removeItem(STORAGE_MEMBERS_KEY)
    sessionStorage.removeItem(STORAGE_ASSIGNMENTS_KEY)
    const initial = loadMembers(user)
    setMembers(initial)
    saveMembers(initial)
    alert('Local cockpit test data cleared. Remote AWS rooms are unchanged.')
  }

  const normalizedCurrentUserId = (user?.username || user?.userId || '').toLowerCase()
  const filteredSessions = sessions.filter((session) => {
    if (!mySessionsOnly) return true
    const hostId = String(session?.hostId || '').toLowerCase()
    const hostName = String(session?.host || '').toLowerCase()
    const userName = String(user?.name || '').toLowerCase()
    return hostId === normalizedCurrentUserId || (!!userName && hostName === userName)
  })

  if (!isAdmin) {
    return (
      <div className="page" style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <BackgroundParticles />
        <div className="aurora-bg" />
        <div className="glass-panel" style={{ padding: 40, maxWidth: 520, textAlign: 'center' }}>
          <h2 className="display-title" style={{ fontSize: 28, marginBottom: 12 }}>Access Restricted</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            This cockpit is for organization admins and co-admins. Ask your admin for access or switch to personal mode.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-lime" onClick={() => navigate('/join')}>Join a meeting</button>
            <button className="btn btn-ghost" onClick={handleSignOut}>Sign out</button>
          </div>
        </div>
      </div>
    )
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
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
            <button className="btn btn-ghost" onClick={() => setMySessionsOnly((prev) => !prev)} style={{ padding: '8px 14px', fontSize: 13 }}>
              <Filter size={14} /> {mySessionsOnly ? 'My sessions only' : 'All active sessions'}
            </button>
            <button className="btn btn-ghost" onClick={fetchRooms} style={{ padding: '8px 14px', fontSize: 13 }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button className="btn btn-ghost" onClick={handleResetLocalTestData} style={{ padding: '8px 14px', fontSize: 13 }}>
              <Eraser size={14} /> Reset local test data
            </button>
          </div>
        </motion.div>

        <div className="glass-panel" style={{ padding: 28, marginBottom: 32, display: 'grid', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Organization team</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Add members or co-admins. Members only join assigned sessions.
              </p>
            </div>
            <div className="badge badge-glass" style={{ fontSize: 12, padding: '6px 12px' }}>
              {members.length} people
            </div>
          </div>

          <form onSubmit={handleAddMember} style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <input className="input" placeholder="Full name" value={memberForm.name} onChange={handleMemberField('name')} />
            <input className="input" placeholder="Email" value={memberForm.email} onChange={handleMemberField('email')} />
            <select className="input" value={memberForm.role} onChange={handleMemberField('role')}>
              <option value="member">Member</option>
              <option value="co-admin">Co-Admin</option>
            </select>
            <button className="btn btn-lime" type="submit">Add member</button>
          </form>

          <div style={{ display: 'grid', gap: 10 }}>
            {members.map((member) => (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{member.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{member.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="badge badge-glass" style={{ fontSize: 11 }}>{member.role}</span>
                  {user?.role === 'admin' && member.role === 'member' && (
                    <button className="btn btn-ghost" type="button" onClick={() => handlePromote(member.id)} style={{ padding: '6px 12px', fontSize: 12 }}>
                      Promote
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grid of Spatial Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>Loading active sessions...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 32, paddingBottom: 60 }}>
            {filteredSessions.map((session, i) => (
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

            {filteredSessions.length === 0 && (
              <div className="glass-panel" style={{ padding: 28, color: 'var(--text-secondary)' }}>
                No sessions match this filter. Toggle to "All active sessions" to view all rooms.
              </div>
            )}

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
        {isModalOpen && (
          <CreateRoomModal
            isOpen={isModalOpen}
            orgMembers={members}
            onClose={() => { setIsModalOpen(false); fetchRooms(); }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
