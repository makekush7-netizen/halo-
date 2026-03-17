import { X, BarChart2, Eye, EyeOff, Mic, MicOff, MousePointer2 } from 'lucide-react'

function attentionClass(score) {
  if (score >= 70) return 'high'
  if (score >= 50) return 'mid'
  return 'low'
}

function ScoreRing({ score }) {
  const cls = attentionClass(score)
  const color = cls === 'high' ? 'var(--status-green)' : cls === 'mid' ? 'var(--status-amber)' : 'var(--status-red)'
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      border: `2px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color,
      background: `${color}15`,
      flexShrink: 0
    }}>
      {score}
    </div>
  )
}

export default function AttentionPanel({ participants, onClose }) {
  const avg = Math.round(participants.reduce((a, p) => a + p.attention, 0) / participants.length)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart2 size={15} color="var(--accent-blue)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Attention Monitor</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      {/* Avg score */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Session Average
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ScoreRing score={avg} />
          <div style={{ flex: 1 }}>
            <div className="attention-bar" style={{ height: 6 }}>
              <div className={`attention-fill ${attentionClass(avg)}`} style={{ width: `${avg}%` }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
              {avg >= 70 ? 'Session is engaged' : avg >= 50 ? 'Some drift detected' : 'Attention needed!'}
            </div>
          </div>
        </div>
        {avg < 60 && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--status-amber-bg)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, fontSize: 12, color: 'var(--status-amber)' }}>
            ⚠ Attention below 60% for this session
          </div>
        )}
      </div>

      {/* Participant list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {participants.map(p => {
          const cls = attentionClass(p.attention)
          return (
            <div key={p.id} style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <ScoreRing score={p.attention} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  {p.isCameraOn ? <Eye size={11} color="var(--status-green)" /> : <EyeOff size={11} color="var(--text-muted)" />}
                  {!p.isMuted ? <Mic size={11} color="var(--status-green)" /> : <MicOff size={11} color="var(--text-muted)" />}
                  <MousePointer2 size={11} color="var(--status-green)" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>
        Updated every 30s · No facial recognition used
      </div>
    </div>
  )
}
