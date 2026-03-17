import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  MessageSquare, Users, Pen, PhoneOff, ChevronLeft, ShieldAlert,
  Link as LinkIcon, Check
} from 'lucide-react'
import { LiveKitRoom, RoomAudioRenderer, useParticipants, useLocalParticipant } from '@livekit/components-react'
import '@livekit/components-styles'
import SubtitleTicker from '../components/SubtitleTicker.jsx'
import AttentionPanel from '../components/AttentionPanel.jsx'
import ChatPanel from '../components/ChatPanel.jsx'
import ParticipantGrid from '../components/ParticipantGrid.jsx'

const STORAGE_ASSIGNMENTS_KEY = 'halo_room_assignments'

export default function SessionPage() {
  const { roomId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const roomState = location.state || {}

  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [screenShare, setScreenShare] = useState(false)
  const [annotating, setAnnotating] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [token, setToken] = useState('')

  const [activePanel, setActivePanel] = useState(null)
  const [subtitlesOn, setSubtitlesOn] = useState(false)

  const userFromParticipant = JSON.parse(sessionStorage.getItem('halo_participant') || '{}')
  const userFromAuth = JSON.parse(sessionStorage.getItem('halo_user') || '{}')
  const user = Object.assign({}, userFromAuth, userFromParticipant)
  const isHost = user.role === 'admin' || user.role === 'host'
  const displayName = user.displayName || roomState.displayName || 'Guest'
  const userEmail = user.email || userFromAuth.email || ''

  const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || 'wss://your-livekit-server'

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    if (!API_BASE_URL) {
      console.warn('VITE_API_BASE_URL not set — LiveKit token cannot be fetched. Session will run without live video.')
      return
    }

    async function fetchToken() {
      try {
        const res = await fetch(`${API_BASE_URL}/livekit-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName: roomId, participantName: displayName })
        })
        const data = await res.json()
        if (data.token) {
          setToken(data.token)
        }
      } catch (err) {
        console.error('Failed to fetch LiveKit token:', err)
      }
    }
    fetchToken()
  }, [roomId, displayName])

  function handleEndSession() {
    if (window.confirm('Leave this session?')) {
      if (isHost) navigate(`/report/${roomId}`, { state: { roomName: roomState.name } })
      else navigate('/')
    }
  }

  function handleCopyLink() {
    const inviteLink = `${window.location.origin}/join/${roomId}`
    navigator.clipboard.writeText(inviteLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const assignments = (() => {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_ASSIGNMENTS_KEY) || '{}')
    } catch {
      return {}
    }
  })()

  const assignedEmails = assignments[roomId] || []
  const requiresAssignment = assignedEmails.length > 0
  const isMember = user.role === 'member'
  const hasAccess = !isMember || !requiresAssignment || assignedEmails.includes(userEmail)

  if (!hasAccess) {
    return (
      <div className="page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)' }}>
        <div className="glass-panel" style={{ padding: 32, maxWidth: 520, textAlign: 'center' }}>
          <h2 className="display-title" style={{ fontSize: 26, marginBottom: 12 }}>Access Restricted</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            This session is assigned to specific organization members. Ask your admin for access.
          </p>
          <button className="btn btn-lime" onClick={() => navigate('/join')}>Go back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="session-shell">
      <div className="aurora-bg dimmed" />

      <LiveKitRoom
        video={camOn}
        audio={micOn}
        screen={screenShare}
        token={token}
        serverUrl={LIVEKIT_URL}
        data-lk-theme="default"
        style={{ display: 'contents' }}
      >
        <SessionRoomUI
          roomId={roomId}
          roomName={roomState.name}
          copiedLink={copiedLink}
          onCopyLink={handleCopyLink}
          onBack={() => navigate(-1)}
          isHost={isHost}
          camOn={camOn}
          micOn={micOn}
          screenShare={screenShare}
          annotating={annotating}
          subtitlesOn={subtitlesOn}
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          setMicOn={setMicOn}
          setCamOn={setCamOn}
          setScreenShare={setScreenShare}
          setAnnotating={setAnnotating}
          setSubtitlesOn={setSubtitlesOn}
          handleEndSession={handleEndSession}
          displayName={displayName}
        />
      </LiveKitRoom>
    </div>
  )
}

function SessionRoomUI({
  roomId,
  roomName,
  copiedLink,
  onCopyLink,
  onBack,
  isHost,
  camOn,
  micOn,
  screenShare,
  annotating,
  subtitlesOn,
  activePanel,
  setActivePanel,
  setMicOn,
  setCamOn,
  setScreenShare,
  setAnnotating,
  setSubtitlesOn,
  handleEndSession,
  displayName,
}) {
  const participants = useParticipants()
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant()
  const [mediaError, setMediaError] = useState('')

  const insecureMediaContext =
    typeof window !== 'undefined' &&
    !window.isSecureContext &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'

  useEffect(() => {
    if (typeof isMicrophoneEnabled === 'boolean') {
      setMicOn(isMicrophoneEnabled)
    }
  }, [isMicrophoneEnabled, setMicOn])

  useEffect(() => {
    if (typeof isCameraEnabled === 'boolean') {
      setCamOn(isCameraEnabled)
    }
  }, [isCameraEnabled, setCamOn])

  useEffect(() => {
    if (typeof isScreenShareEnabled === 'boolean') {
      setScreenShare(isScreenShareEnabled)
    }
  }, [isScreenShareEnabled, setScreenShare])

  const showMediaError = (message) => {
    setMediaError(message)
    setTimeout(() => setMediaError(''), 3600)
  }

  const ensureDevicePermission = async (kind) => {
    if (insecureMediaContext) {
      throw new Error('Camera and mic require HTTPS on network devices. Use localhost or HTTPS tunnel.')
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Media devices are not available in this browser.')
    }

    if (kind === 'audio') {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      return
    }

    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    stream.getTracks().forEach((t) => t.stop())
  }

  const toggleMic = async () => {
    try {
      if (!micOn) {
        await ensureDevicePermission('audio')
      }
      if (localParticipant) {
        await localParticipant.setMicrophoneEnabled(!micOn)
      }
      setMicOn(!micOn)
    } catch (e) {
      console.error('Failed to toggle mic:', e)
      showMediaError(e?.message || 'Unable to toggle microphone.')
    }
  }

  const toggleCam = async () => {
    try {
      if (!camOn) {
        await ensureDevicePermission('video')
      }
      if (localParticipant) {
        await localParticipant.setCameraEnabled(!camOn)
      }
      setCamOn(!camOn)
    } catch (e) {
      console.error('Failed to toggle cam:', e)
      showMediaError(e?.message || 'Unable to toggle camera.')
    }
  }

  const toggleScreenShare = async () => {
    try {
      if (localParticipant) {
        await localParticipant.setScreenShareEnabled(!screenShare)
      }
      setScreenShare(!screenShare)
    } catch (e) {
      console.error('Failed to toggle screen share:', e)
      showMediaError(e?.message || 'Unable to toggle screen share.')
    }
  }

  const toggleSubtitles = () => {
    setSubtitlesOn((prev) => !prev)
  }

  return (
    <>
      <header className="session-top">
        <div className="session-top-left">
          <button className="btn btn-ghost session-back" onClick={onBack}>
            <ChevronLeft size={18} />
          </button>
          <div>
            <div className="session-title">{roomName || `Session ${roomId}`}</div>
            <div className="session-meta">
              <span className="session-live"><span className="live-dot" /> Live</span>
              <span className="session-code">Code: {roomId}</span>
              <button className="session-copy" onClick={onCopyLink}>
                {copiedLink ? 'Copied' : 'Copy link'}
              </button>
            </div>
          </div>
        </div>

        <div className="session-top-right">
          <button className="btn btn-ghost" onClick={() => setActivePanel((p) => p === 'participants' ? null : 'participants')}>
            <Users size={16} /> {participants.length || 1}
          </button>
          {isHost && (
            <div className="badge badge-amber" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <ShieldAlert size={12} /> Host
            </div>
          )}
        </div>
      </header>

      <main className="session-main">
        <div className="session-stage">
          {mediaError && <div className="session-warning">{mediaError}</div>}
          {insecureMediaContext && (
            <div className="session-warning session-warning-muted">
              Network URL detected without HTTPS. Mic/cam may be blocked by browser policy.
            </div>
          )}
          <ParticipantGrid screenShare={screenShare} annotating={annotating} />
          <RoomAudioRenderer />

          <AnimatePresence>
            {subtitlesOn && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                style={{ position: 'absolute', bottom: 32, left: 32, right: 32, pointerEvents: 'none' }}
              >
                <SubtitleTicker roomId={roomId} active={subtitlesOn} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {activePanel && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="glass-panel session-aside"
            >
              {activePanel === 'chat' && <ChatPanel displayName={displayName} onClose={() => setActivePanel(null)} />}
              {activePanel === 'attention' && <AttentionPanel onClose={() => setActivePanel(null)} />}
              {activePanel === 'participants' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Participants</div>
                    <button onClick={() => setActivePanel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                      ✕
                    </button>
                  </div>
                  <div style={{ padding: 12, display: 'grid', gap: 10, overflow: 'auto' }}>
                    {participants.map((p) => (
                      <div key={p.identity} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name || p.identity}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.isMicrophoneEnabled ? 'Mic on' : 'Muted'} · {p.isCameraEnabled ? 'Camera on' : 'Camera off'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {!p.isMicrophoneEnabled && <MicOff size={14} color="var(--status-red)" />}
                          {!p.isCameraEnabled && <VideoOff size={14} color="var(--status-amber)" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </main>

      <div className="session-controls glass-panel">
        <button className={`control-btn ${!micOn ? 'danger' : ''}`} onClick={toggleMic} title="Toggle Microphone">
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <button className={`control-btn ${!camOn ? 'danger' : ''}`} onClick={toggleCam} title="Toggle Camera">
          {camOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        <button className={`control-btn ${screenShare ? 'active' : ''}`} onClick={toggleScreenShare} title="Share Screen">
          {screenShare ? <MonitorOff size={20} /> : <Monitor size={20} />}
        </button>
        {screenShare && (
          <button className={`control-btn ${annotating ? 'active' : ''}`} onClick={() => setAnnotating(!annotating)} title="Annotate">
            <Pen size={18} />
          </button>
        )}

        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 12px' }} />

        <button className="control-btn" onClick={onCopyLink} title="Copy Join Link" style={{ color: copiedLink ? '#10b981' : 'white' }}>
          {copiedLink ? <Check size={18} /> : <LinkIcon size={18} />}
        </button>

        <button className={`control-btn ${subtitlesOn ? 'active' : ''}`} onClick={toggleSubtitles} title="Captions">
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>CC</span>
        </button>

        <button className={`control-btn ${activePanel === 'chat' ? 'active' : ''}`} onClick={() => setActivePanel(p => p === 'chat' ? null : 'chat')} title="Chat">
          <MessageSquare size={18} />
        </button>

        {isHost && (
          <button className={`control-btn ${activePanel === 'attention' ? 'active' : ''}`} onClick={() => setActivePanel(p => p === 'attention' ? null : 'attention')} title="Attention Monitor">
            <Users size={18} />
          </button>
        )}

        <button className={`control-btn ${activePanel === 'participants' ? 'active' : ''}`} onClick={() => setActivePanel(p => p === 'participants' ? null : 'participants')} title="Participants">
          <Users size={18} />
        </button>

        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 12px' }} />

        <button className="control-btn danger" style={{ width: 56, borderRadius: 28 }} onClick={handleEndSession} title="Leave Session">
          <PhoneOff size={20} />
        </button>
      </div>
    </>
  )
}
