import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import { Plus, RefreshCw, ArrowRight, Users, Clock, LogOut, Copy, CheckCircle2, Filter, Eraser } from 'lucide-react'
import BackgroundParticles from '../components/BackgroundParticles.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const STORAGE_MEMBERS_KEY = 'halo_org_members'
const STORAGE_ASSIGNMENTS_KEY = 'halo_room_assignments'

function membersStorageKey(orgId) {
  return `${STORAGE_MEMBERS_KEY}_${orgId || 'personal'}`
}

function assignmentsStorageKey(orgId) {
  return `${STORAGE_ASSIGNMENTS_KEY}_${orgId || 'personal'}`
}

function roleLabel(role) {
  if (role === 'member') return 'teacher'
  return role
}

function toOrgId(value) {
  return (value || 'personal').toString().trim().toLowerCase().replace(/\s+/g, '-')
}

function loadMembers(user, orgId) {
  try {
    const stored = JSON.parse(sessionStorage.getItem(membersStorageKey(orgId)) || '[]')
    if (stored.length > 0) {
      return stored.map((member) => ({
        ...member,
        id: (member.id || member.email || '').toString().toLowerCase(),
      }))
    }
  } catch {
    // Ignore parse errors and fall back to defaults.
  }

  return [
    {
      id: (user?.userId || user?.username || user?.email || 'owner').toString().toLowerCase(),
      name: user?.name || 'Org Admin',
      email: user?.email || 'admin@halo.com',
      role: user?.role || 'admin',
    },
  ]
}

function saveMembers(members, orgId) {
  sessionStorage.setItem(membersStorageKey(orgId), JSON.stringify(members))
}

function loadAssignments(orgId) {
  try {
    return JSON.parse(sessionStorage.getItem(assignmentsStorageKey(orgId)) || '{}')
  } catch {
    return {}
  }
}

function saveAssignments(assignments, orgId) {
  sessionStorage.setItem(assignmentsStorageKey(orgId), JSON.stringify(assignments))
}

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

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const attnColor = session.attention >= 70 ? 'var(--status-green)' : session.attention >= 50 ? 'var(--status-amber)' : 'var(--status-red)'
  const status = session.status || 'ACTIVE'
  const statusColor = status === 'SCHEDULED' ? 'var(--status-amber)' : 'var(--accent-blue)'
  const startText = session.startsAt ? new Date(session.startsAt).toLocaleString() : 'Instant'

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
            <div className="badge badge-glass" style={{ color: statusColor, background: 'rgba(59,130,246,0.1)' }}>
              <div className="live-dot" style={{ background: statusColor, boxShadow: 'none' }} /> {status}
            </div>
            <div className="badge badge-glass" style={{ color: attnColor, borderColor: `${attnColor}40` }}>
              {session.attention || 100}% Attention
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: -8 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  border: '2px solid var(--glass-bg)',
                  background: `linear-gradient(135deg, hsl(${i * 60}, 70%, 50%), hsl(${i * 60 + 30}, 80%, 40%))`,
                  marginLeft: i > 1 ? -12 : 0,
                  filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ padding: '24px 20px' }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
            {session.name}
            <ArrowRight size={18} color="var(--text-muted)" />
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
            Owner: {session.ownerName || session.host || 'Unknown'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>
            {session.meetingType === 'scheduled' ? `Scheduled at ${startText}` : 'Instant session'}
          </p>
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

function CreateRoomModal({ isOpen, onClose, orgMembers, user, isAdmin, orgId }) {
  const navigate = useNavigate()
  const [roomName, setRoomName] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdRoom, setCreatedRoom] = useState(null)
  const [copied, setCopied] = useState(false)
  const [meetingType, setMeetingType] = useState('instant')
  const [startsAtLocal, setStartsAtLocal] = useState('')
  const [endsAtLocal, setEndsAtLocal] = useState('')
  const teacherMembers = (orgMembers || []).filter((member) => member.role === 'member')
  const [selectedTeacherId, setSelectedTeacherId] = useState(() => {
    const me = (user?.userId || user?.username || user?.email || '').toString().toLowerCase()
    if (!isAdmin) return me
    return teacherMembers[0]?.id || me
  })
  const [assignedEmails, setAssignedEmails] = useState(() => new Set(
    (orgMembers || []).filter((member) => member.role === 'member').map((member) => member.email || '')
  ))

  if (!isOpen) return null

  const selectedTeacher = teacherMembers.find((m) => m.id === selectedTeacherId)

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!API_BASE_URL) throw new Error('API URL not configured yet. Run deploy scripts.')
      if (meetingType === 'scheduled' && !startsAtLocal) throw new Error('Select schedule start time.')

      const ownerUserId = isAdmin
        ? (selectedTeacher?.id || selectedTeacherId || (user?.userId || user?.username || user?.email || '')).toString().toLowerCase()
        : (user?.userId || user?.username || user?.email || '').toString().toLowerCase()

      const ownerName = isAdmin ? (selectedTeacher?.name || user?.name || 'Teacher') : (user?.name || 'Teacher')
      const status = meetingType === 'scheduled' ? 'SCHEDULED' : 'ACTIVE'

      const res = await fetch(`${API_BASE_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName,
          hostDetails: { name: user?.name, id: user?.username || user?.userId || user?.email },
          orgId,
          visibility: 'org',
          ownerUserId,
          ownerName,
          ownerRole: selectedTeacher ? 'member' : user?.role || 'member',
          assignedTeacherUserId: selectedTeacher?.id || ownerUserId,
          assignedTeacherName: selectedTeacher?.name || ownerName,
          startsAt: meetingType === 'scheduled' ? new Date(startsAtLocal).toISOString() : new Date().toISOString(),
          endsAt: endsAtLocal ? new Date(endsAtLocal).toISOString() : null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          meetingType,
          status,
        }),
      })

      if (!res.ok) throw new Error('Failed to create room')
      const data = await res.json()

      setCreatedRoom({ id: data.roomId, name: data.name, host: data.host, status })
      const assignments = loadAssignments(orgId)
      assignments[data.roomId] = Array.from(assignedEmails)
      saveAssignments(assignments, orgId)
    } catch (err) {
      console.error(err)
      alert(err.message)
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
    sessionStorage.setItem('halo_participant', JSON.stringify({ displayName: user?.name || 'Host', role: user?.role === 'member' ? 'host' : 'admin' }))
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-panel"
        style={{ width: '100%', maxWidth: 560, padding: 40, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(20,22,34,0.85)' }}
      >
        {!createdRoom ? (
          <form onSubmit={handleCreate} style={{ display: 'grid', gap: 14 }}>
            <h2 className="display-title" style={{ fontSize: 24, marginBottom: 4 }}>Create Session</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 10 }}>
              {isAdmin ? 'Create instant or scheduled sessions and assign teachers.' : 'Create your own instant or scheduled sessions.'}
            </p>

            <div>
              <label className="label">Session Name</label>
              <input required autoFocus className="input" placeholder="e.g. Weekly Standup" value={roomName} onChange={(e) => setRoomName(e.target.value)} />
            </div>

            <div>
              <label className="label">Meeting Type</label>
              <select className="input" value={meetingType} onChange={(e) => setMeetingType(e.target.value)}>
                <option value="instant">Instant (start now)</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            {meetingType === 'scheduled' && (
              <>
                <div>
                  <label className="label">Start Time</label>
                  <input type="datetime-local" className="input" value={startsAtLocal} onChange={(e) => setStartsAtLocal(e.target.value)} required />
                </div>
                <div>
                  <label className="label">End Time (optional)</label>
                  <input type="datetime-local" className="input" value={endsAtLocal} onChange={(e) => setEndsAtLocal(e.target.value)} />
                </div>
              </>
            )}

            {isAdmin && teacherMembers.length > 0 && (
              <div>
                <label className="label">Assign Teacher</label>
                <select className="input" value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)}>
                  {teacherMembers.map((member) => (
                    <option key={member.id} value={member.id}>{member.name} ({member.email})</option>
                  ))}
                </select>
              </div>
            )}

            {isAdmin && teacherMembers.length > 0 && (
              <div>
                <label className="label">Assign participants (optional)</label>
                <div style={{ display: 'grid', gap: 8, maxHeight: 160, overflow: 'auto', paddingRight: 6 }}>
                  {teacherMembers.map((member) => (
                    <label key={member.id} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                      <input type="checkbox" checked={assignedEmails.has(member.email)} onChange={() => toggleAssign(member.email)} />
                      <span>{member.name}  {member.email}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="button" className="btn btn-glass" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                {loading ? 'Saving...' : meetingType === 'scheduled' ? 'Schedule Session' : 'Create Session'}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, color: 'var(--status-green)' }}>
              <CheckCircle2 size={24} />
              <h2 className="display-title" style={{ fontSize: 24, background: 'none', WebkitTextFillColor: 'unset', color: 'white' }}>
                {createdRoom.status === 'SCHEDULED' ? 'Session Scheduled' : 'Session Created'}
              </h2>
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
  const role = user?.role || 'member'
  const isAdmin = role === 'admin' || role === 'co-admin'
  const orgId = toOrgId(user?.orgName)
  const [members, setMembers] = useState(() => loadMembers(user, orgId))
  const [memberForm, setMemberForm] = useState({ name: '', email: '', role: 'member' })
  const [mySessionsOnly, setMySessionsOnly] = useState(!isAdmin)

  const fetchRooms = async () => {
    setLoading(true)
    try {
      if (!API_BASE_URL) {
        setSessions([])
        return
      }

      const userId = (user?.userId || user?.username || user?.email || '').toString().toLowerCase()
      const params = new URLSearchParams({
        role,
        userId,
        orgId,
        includeAll: (!mySessionsOnly && isAdmin) ? 'true' : 'false',
      })

      const res = await fetch(`${API_BASE_URL}/rooms?${params.toString()}`)
      const data = await res.json()
      setSessions(data.rooms || [])
    } catch (e) {
      console.error('Failed to fetch rooms:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
    const interval = setInterval(fetchRooms, 30000)
    return () => clearInterval(interval)
  }, [mySessionsOnly, role, orgId, user?.userId, user?.username, user?.email])

  useEffect(() => {
    if (user) {
      const initial = loadMembers(user, orgId)
      setMembers(initial)
      saveMembers(initial, orgId)
    }
  }, [user, orgId])

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
    const emailKey = memberForm.email.trim().toLowerCase()
    const next = [
      ...members,
      {
        id: emailKey,
        name: memberForm.name.trim(),
        email: emailKey,
        role: memberForm.role,
      },
    ]
    setMembers(next)
    saveMembers(next, orgId)
    setMemberForm({ name: '', email: '', role: 'member' })
  }

  const handlePromote = (memberId) => {
    const next = members.map((member) => {
      if (member.id !== memberId) return member
      if (member.role === 'co-admin') return member
      return { ...member, role: 'co-admin' }
    })
    setMembers(next)
    saveMembers(next, orgId)
  }

  const handleResetLocalTestData = () => {
    sessionStorage.removeItem(membersStorageKey(orgId))
    sessionStorage.removeItem(assignmentsStorageKey(orgId))
    sessionStorage.removeItem(STORAGE_MEMBERS_KEY)
    sessionStorage.removeItem(STORAGE_ASSIGNMENTS_KEY)
    const initial = loadMembers(user, orgId)
    setMembers(initial)
    saveMembers(initial, orgId)
    alert('Local cockpit test data cleared. Remote AWS rooms are unchanged.')
  }

  const headerTitle = isAdmin ? 'Admin Cockpit' : 'Teacher Cockpit'
  const headerSubtitle = isAdmin
    ? 'Create, assign, monitor, and schedule org sessions.'
    : 'Create and schedule your own sessions. Admins can monitor your activity.'

  const sortedSessions = useMemo(() => {
    const next = [...sessions]
    next.sort((a, b) => {
      const at = new Date(a.startsAt || a.createdAt || 0).getTime()
      const bt = new Date(b.startsAt || b.createdAt || 0).getTime()
      return bt - at
    })
    return next
  }, [sessions])

  return (
    <div className="page" style={{ position: 'relative', overflow: 'hidden' }}>
      <BackgroundParticles />
      <div className="aurora-bg" />

      <nav className="nav">
        <div className="logo-text" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}> Halo</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: 20 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{user?.name || 'User'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email}</div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 18, background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14 }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
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
          <h1 className="display-title" style={{ fontSize: 32, marginBottom: 8 }}>{headerTitle}</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 15 }}>{headerSubtitle}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
            {isAdmin && (
              <button className="btn btn-ghost" onClick={() => setMySessionsOnly((prev) => !prev)} style={{ padding: '8px 14px', fontSize: 13 }}>
                <Filter size={14} /> {mySessionsOnly ? 'My sessions only' : 'All org sessions'}
              </button>
            )}
            <button className="btn btn-ghost" onClick={fetchRooms} style={{ padding: '8px 14px', fontSize: 13 }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button className="btn btn-ghost" onClick={handleResetLocalTestData} style={{ padding: '8px 14px', fontSize: 13 }}>
              <Eraser size={14} /> Reset local test data
            </button>
          </div>
        </motion.div>

        {isAdmin && (
          <div className="glass-panel" style={{ padding: 28, marginBottom: 32, display: 'grid', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Organization team</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  Add teachers or co-admins. Admin can schedule meetings for any teacher.
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
                <option value="member">Teacher</option>
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
                    <span className="badge badge-glass" style={{ fontSize: 11 }}>{roleLabel(member.role)}</span>
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
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>Loading active sessions...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 32, paddingBottom: 60 }}>
            {sortedSessions.map((session, i) => (
              <motion.div key={session.roomId} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <SpatialSessionCard
                  session={session}
                  onClick={() => {
                    sessionStorage.setItem('halo_participant', JSON.stringify({ displayName: user?.name || 'Host', role: isAdmin ? 'admin' : 'host' }))
                    navigate(`/session/${session.roomId}`, { state: session })
                  }}
                />
              </motion.div>
            ))}

            {sortedSessions.length === 0 && (
              <div className="glass-panel" style={{ padding: 28, color: 'var(--text-secondary)' }}>
                No sessions yet. Create an instant or scheduled session to get started.
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-panel"
              onClick={() => setIsModalOpen(true)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed rgba(255,255,255,0.1)',
                background: 'transparent',
                cursor: 'pointer',
                minHeight: 320,
                gap: 16,
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: 28, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={24} color="var(--text-muted)" />
              </div>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Create or Schedule Session</span>
            </motion.div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <CreateRoomModal
            isOpen={isModalOpen}
            orgMembers={members}
            user={user}
            isAdmin={isAdmin}
            orgId={orgId}
            onClose={() => {
              setIsModalOpen(false)
              fetchRooms()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
