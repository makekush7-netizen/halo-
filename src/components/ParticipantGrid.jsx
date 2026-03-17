import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MicOff, Expand, Monitor } from 'lucide-react'
import { useTracks, VideoTrack } from '@livekit/components-react'
import { Track } from 'livekit-client'

// Helper to get initials for the fallback avatar
const getInitials = (name) => name?.substring(0, 2).toUpperCase() || 'P'

// The individual tile component
function Tile({ trackRef, isSpotlight, onClick }) {
  // In a real app, you'd fetch this from your AI attention lambda. Defaulting to 90 for demo.
  const attention = 90;
  const cn = `glass-panel ${isSpotlight ? 'spotlight' : 'strip-tile'} ${attention < 50 ? 'low-attn' : ''}`
  
  const participant = trackRef?.participant
  const isMuted = !participant?.isMicrophoneEnabled
  const isCameraOn = participant?.isCameraEnabled

  return (
    <motion.div
      layoutId={`tile-${participant.identity}`}
      onClick={onClick}
      className={cn}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        mass: 0.8
      }}
      style={{
        position: 'relative',
        cursor: 'pointer',
        overflow: 'hidden',
        border: isSpotlight ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid var(--glass-border)',
        boxShadow: isSpotlight ? '0 0 40px rgba(6, 182, 212, 0.15), inset 0 0 20px rgba(6, 182, 212, 0.05)' : 'var(--shadow-float)',
        borderRadius: isSpotlight ? 24 : 16,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(11, 15, 25, 0.7)',
        backdropFilter: 'blur(20px)'
      }}
    >
      {/* LiveKit Video Track */}
      {isCameraOn && trackRef ? (
        <VideoTrack
          trackRef={trackRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        /* Fallback Avatar */
        <motion.div 
          layoutId={`avatar-${participant.identity}`}
          style={{
            width: isSpotlight ? 120 : 48,
            height: isSpotlight ? 120 : 48,
            borderRadius: '50%',
            background: `linear-gradient(135deg, var(--accent-blue), var(--accent-purple))`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isSpotlight ? 40 : 18,
            fontWeight: 700,
            color: 'white',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          }}
        >
          {getInitials(participant?.name || participant?.identity)}
        </motion.div>
      )}

      {/* Overlay Info */}
      <motion.div 
        layoutId={`info-${participant.identity}`}
        style={{
          position: 'absolute',
          bottom: isSpotlight ? 24 : 12,
          left: isSpotlight ? 24 : 12,
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,0,0,0.6)',
          padding: '6px 12px',
          borderRadius: 100,
          backdropFilter: 'blur(10px)',
        }}
      >
        <span style={{ color: 'white', fontSize: isSpotlight ? 14 : 12, fontWeight: 500 }}>
          {participant?.name || participant?.identity || 'Guest'}
        </span>
        {isMuted && <MicOff size={isSpotlight ? 14 : 12} color="var(--status-red)" />}
      </motion.div>

      {/* Expand Hint */}
      {!isSpotlight && (
        <div style={{ position: 'absolute', top: 12, right: 12, opacity: 0.5 }}>
          <Expand size={14} color="white" />
        </div>
      )}
    </motion.div>
  )
}

// Accepts screenShare prop from parent, but participants are pulled from LiveKit Room context
export default function ParticipantGrid({ screenShare, annotating }) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], { withPlaceholder: true })
  const cameraTracks = tracks.filter((t) => t.source === Track.Source.Camera)
  const screenTracks = tracks.filter((t) => t.source === Track.Source.ScreenShare)
  const annotationCanvasRef = useRef(null)
  const drawContainerRef = useRef(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef({ x: 0, y: 0 })
  
  // Track active speaker: default to whoever is speaking or the first participant
  const [activeSpeakerId, setActiveSpeakerId] = useState(null)

  useEffect(() => {
    if (!cameraTracks.length) return;
    const speaker = cameraTracks.find((t) => t.participant?.isSpeaking)
    if (speaker) {
      setActiveSpeakerId(speaker.participant?.identity)
    } else if (!activeSpeakerId || !cameraTracks.find((t) => t.participant?.identity === activeSpeakerId)) {
      // Fallback to first participant if current active speaker left
      setActiveSpeakerId(cameraTracks[0].participant?.identity)
    }
  }, [cameraTracks, activeSpeakerId])

  // Split participants into Hero (spotlight) and Strip (others)
  const heroTrack = cameraTracks.find((t) => t.participant?.identity === activeSpeakerId) || cameraTracks[0]
  const stripTracks = cameraTracks.filter((t) => t.participant?.identity !== heroTrack?.participant?.identity)

  // Find if anyone is screen sharing (real LiveKit check)
  const screenShareTrack = screenTracks[0]
  const isScreenSharingReal = screenShare || !!screenShareTrack

  useEffect(() => {
    if (!isScreenSharingReal || !annotating || !annotationCanvasRef.current || !drawContainerRef.current) {
      return
    }

    const canvas = annotationCanvasRef.current
    const container = drawContainerRef.current
    const rect = container.getBoundingClientRect()
    const ratio = window.devicePixelRatio || 1

    canvas.width = Math.max(1, Math.floor(rect.width * ratio))
    canvas.height = Math.max(1, Math.floor(rect.height * ratio))
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(ratio, ratio)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#ffde59'
    ctx.lineWidth = 3
  }, [isScreenSharingReal, annotating])

  if (cameraTracks.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'white' }}>Waiting for participants to join...</p>
      </div>
    )
  }

  const getPoint = (event) => {
    const canvas = annotationCanvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const point = event.touches?.[0] || event
    return {
      x: point.clientX - rect.left,
      y: point.clientY - rect.top,
    }
  }

  const startDrawing = (event) => {
    if (!annotating) return
    if (event.cancelable) event.preventDefault()
    const ctx = annotationCanvasRef.current?.getContext('2d')
    const point = getPoint(event)
    if (!ctx || !point) return
    isDrawingRef.current = true
    lastPointRef.current = point
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
  }

  const draw = (event) => {
    if (!annotating || !isDrawingRef.current) return
    if (event.cancelable) event.preventDefault()
    const ctx = annotationCanvasRef.current?.getContext('2d')
    const point = getPoint(event)
    if (!ctx || !point) return
    ctx.beginPath()
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    lastPointRef.current = point
  }

  const stopDrawing = () => {
    isDrawingRef.current = false
  }

  const clearAnnotations = () => {
    const canvas = annotationCanvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div style={{ 
      width: '100%', height: '100%', 
      display: 'flex', flexDirection: isScreenSharingReal ? 'row' : 'column',
      gap: 16, padding: 16 
    }}>
      
      {/* Hero / Spotlight Area */}
      <div style={{ 
        flex: 1, 
        minHeight: 0, minWidth: 0,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}>
        <div style={{
          width: '100%', 
          height: '100%',
          maxWidth: 1400,
          aspectRatio: isScreenSharingReal ? 'auto' : '16/9',
          position: 'relative'
        }} ref={drawContainerRef}>
          {isScreenSharingReal ? (
            // Screen Share overrides hero entirely
            <div className="glass-panel" style={{ width: '100%', height: '100%', border: '1px solid var(--accent-cyan)' }}>
              {screenShareTrack ? (
                 <VideoTrack 
                   trackRef={screenShareTrack}
                   style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                 />
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(6, 182, 212, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Monitor size={48} color="var(--accent-cyan)" style={{ marginBottom: 16, opacity: 0.8 }} />
                    <h3 style={{ color: 'white', fontSize: 24, fontWeight: 600 }}>Screen Share Active</h3>
                  </div>
                </div>
              )}

              {annotating && (
                <>
                  <canvas
                    ref={annotationCanvasRef}
                    className="annotation-canvas"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  <button className="annotation-clear-btn" onClick={clearAnnotations}>
                    Clear
                  </button>
                </>
              )}
            </div>
          ) : (
            // No Screen Share: Hero is the active speaker
            heroTrack && (
              <AnimatePresence mode="popLayout">
                <Tile 
                  key={`hero-${heroTrack.participant?.identity || 'hero'}`} 
                  trackRef={heroTrack} 
                  isSpotlight={true} 
                />
              </AnimatePresence>
            )
          )}
        </div>
      </div>

      {/* Strip Area (Floating Row or Column depends on layout) */}
      <div style={{ 
        // If screen sharing, put them in a vertical column on the right. Else, horizontal row at bottom.
        width: isScreenSharingReal ? 280 : '100%',
        height: isScreenSharingReal ? '100%' : 160,
        flexShrink: 0,
        display: 'flex',
        flexDirection: isScreenSharingReal ? 'column' : 'row',
        gap: 12,
        overflowX: isScreenSharingReal ? 'hidden' : 'auto',
        overflowY: isScreenSharingReal ? 'auto' : 'hidden',
        // Scrollbar styling for strict container
        paddingBottom: isScreenSharingReal ? 0 : 8,
        paddingRight: isScreenSharingReal ? 8 : 0,
      }}>
        <AnimatePresence mode="popLayout">
          {/* If screen sharing, the previous "active speaker" is now in the strip too */}
          {(isScreenSharingReal ? cameraTracks : stripTracks).map((trackRef) => (
            <div key={`strip-${trackRef.participant?.identity || 'strip'}`} style={{ 
              width: isScreenSharingReal ? '100%' : 220, 
              height: isScreenSharingReal ? 160 : '100%',
              flexShrink: 0 
            }}>
              <Tile 
                trackRef={trackRef} 
                isSpotlight={false} 
                onClick={() => !isScreenSharingReal && setActiveSpeakerId(trackRef.participant?.identity)} 
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
