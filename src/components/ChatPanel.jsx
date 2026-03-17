import { useState } from 'react'
import { X, Send } from 'lucide-react'

const MOCK_MESSAGES = [
  { id: 1, sender: 'Kush', text: 'Welcome everyone!', ts: '10:02' },
  { id: 2, sender: 'Aryan', text: 'Thanks, great to be here!', ts: '10:03' },
  { id: 3, sender: 'Dev', text: 'Can everyone hear me?', ts: '10:04' },
  { id: 4, sender: 'Priya', text: 'Yes, audio is clear 👍', ts: '10:04' },
]

export default function ChatPanel({ roomId, displayName, onClose }) {
  const [messages, setMessages] = useState(MOCK_MESSAGES)
  const [draft, setDraft] = useState('')

  // In production: messages sent/received via LiveKit DataChannel
  function sendMessage(e) {
    e.preventDefault()
    if (!draft.trim()) return
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: displayName || 'You',
      text: draft.trim(),
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }])
    setDraft('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Chat</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map(msg => {
          const isMe = msg.sender === displayName
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 3 }}>
              {!isMe && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 2 }}>{msg.sender}</span>
              )}
              <div style={{
                maxWidth: '85%',
                padding: '8px 12px',
                borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: isMe ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.06)',
                border: isMe ? '1px solid rgba(59,130,246,0.25)' : '1px solid var(--border)',
                fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5
              }}>
                {msg.text}
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{msg.ts}</span>
            </div>
          )
        })}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <input
          className="input"
          placeholder="Message..."
          value={draft}
          onChange={e => setDraft(e.target.value)}
          style={{ fontSize: 13, padding: '8px 12px' }}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '8px 12px', flexShrink: 0 }}>
          <Send size={14} />
        </button>
      </form>
    </div>
  )
}
