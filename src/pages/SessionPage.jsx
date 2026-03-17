import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, 
  MessageSquare, Users, Pen, PhoneOff, ChevronLeft, ShieldAlert,
  Link as LinkIcon, Check
} from 'lucide-react'
import { LiveKitRoom, RoomAudioRenderer, useTracks, VideoTrack, ControlBar, useToken } from '@livekit/components-react'
import '@livekit/components-styles'
import SubtitleTicker from '../components/SubtitleTicker.jsx'
import AttentionPanel from '../components/AttentionPanel.jsx'
import ChatPanel from '../components/ChatPanel.jsx'
import ParticipantGrid from '../components/ParticipantGrid.jsx'

const MOCK_PARTICIPANTS = [
  { id: '1', name: 'Kush (Me)', isMuted: false, isCameraOn: true, attention: 92 },
  { id: '2', name: 'Aryan', isMuted: true, isCameraOn: true, attention: 78 },
  { id: '3', name: 'Priya', isMuted: false, isCameraOn: false, attention: 45 },
  { id: '4', name: 'Dev', isMuted: true, isCameraOn: true, attention: 88 },
]

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
  
  // Sidebar state ('chat' | 'attention' | null)
  const [activePanel, setActivePanel] = useState(null)
  const [subtitlesOn, setSubtitlesOn] = useState(false)
  
  const user = JSON.parse(sessionStorage.getItem('halo_user') || '{}')
  const isHost = user.role === 'admin' || user.role === 'host'
  const displayName = user.displayName || roomState.displayName || 'Guest'

  const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || 'wss://your-livekit-server'

  useEffect(() => {
    // Wait until we have a real backend, for now, we're ready for LiveKit
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
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
        console.error('Failed to fetch token:', err)
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

  return (
    <div className="page" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-deep)', overflow: 'hidden' }}>
      
      {/* Dimmed Background: We want focus on the video, not glowing orbs */}
      <div className="aurora-bg dimmed" />

      {/* Top Header - Minimalist */}
      <header style={{ 
        height: 64, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-glass" style={{ width: 40, height: 40, padding: 0, borderRadius: 20 }} onClick={() => navigate(-1)}>
            <ChevronLeft size={20} />
          </button>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'white' }}>{roomState.name || `Session ${roomId}`}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              <span>{roomId}</span>
              <span style={{ width: 4, height: 4, borderRadius: 2, background: 'var(--text-muted)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div className="live-dot" /> Live
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isHost && (
            <div className="badge badge-amber" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <ShieldAlert size={12} /> Host Privileges
            </div>
          )}
        </div>
      </header>

      {/* LiveKit Room Wrapper */}
      <LiveKitRoom
        video={camOn}
        audio={micOn}
        screen={screenShare}
        token={token}
        serverUrl={LIVEKIT_URL}
        data-lk-theme="default"
        style={{ display: 'contents' }}
      >
        {/* Main Content Area */}
        <main style={{ flex: 1, display: 'flex', padding: '0 16px 16px', gap: 16, overflow: 'hidden', position: 'relative', zIndex: 10 }}>
          
          {/* Left: Video Grid / Screen Share Stage */}
          <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <ParticipantGrid participants={MOCK_PARTICIPANTS} screenShare={screenShare} annotating={annotating} />
            <RoomAudioRenderer />
            
            {/* Subtitles Overlay */}
            <AnimatePresence>
              {subtitlesOn && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                  style={{ position: 'absolute', bottom: 32, left: 32, right: 32, pointerEvents: 'none' }}
                >
                  <SubtitleTicker active={subtitlesOn} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Collapsible Side Panels */}
          <AnimatePresence mode="wait">
            {activePanel && (
              <motion.aside 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 340, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="glass-panel"
                style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 16 }}
              >
                {activePanel === 'chat' && <ChatPanel displayName={displayName} onClose={() => setActivePanel(null)} />}
                {activePanel === 'attention' && <AttentionPanel participants={MOCK_PARTICIPANTS} onClose={() => setActivePanel(null)} />}
              </motion.aside>
            )}
          </AnimatePresence>
        </main>

        {/* Floating Control Pill (Google Meet Style) */}
        <div className="meet-controls glass-panel" style={{ borderRadius: 100, padding: '12px 24px', border: '1px solid rgba(255,255,255,0.12)', zIndex: 50 }}>
          <button className={`control-btn ${!micOn ? 'danger' : ''}`} onClick={() => setMicOn(!micOn)} title="Toggle Microphone">
            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          <button className={`control-btn ${!camOn ? 'danger' : ''}`} onClick={() => setCamOn(!camOn)} title="Toggle Camera">
            {camOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
          <button className={`control-btn ${screenShare ? 'active' : ''}`} onClick={() => setScreenShare(!screenShare)} title="Share Screen">
            {screenShare ? <MonitorOff size={20} /> : <Monitor size={20} />}
          </button>
          {screenShare && (
            <button className={`control-btn ${annotating ? 'active' : ''}`} onClick={() => setAnnotating(!annotating)} title="Annotate">
              <Pen size={18} />
            </button>
          )}

          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 12px' }} />

          {/* Copy Link Toggle */}
          <button className="control-btn" onClick={handleCopyLink} title="Copy Join Link" style={{ color: copiedLink ? '#10b981' : 'white' }}>
            {copiedLink ? <Check size={18} /> : <LinkIcon size={18} />}
          </button>

          {/* CC Toggle */}
          <button className={`control-btn ${subtitlesOn ? 'active' : ''}`} onClick={() => setSubtitlesOn(!subtitlesOn)} title="Captions">
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

          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 12px' }} />

          <button className="control-btn danger" style={{ width: 56, borderRadius: 28 }} onClick={handleEndSession} title="Leave Session">
            <PhoneOff size={20} />
          </button>
        </div>
      </LiveKitRoom>
    </div>
  )
}
