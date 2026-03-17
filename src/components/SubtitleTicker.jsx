import { useEffect, useState, useRef } from 'react'
import { Mic } from 'lucide-react'

// Mock ticker — will be replaced by Amazon Transcribe Streaming WebSocket
const SAMPLE_PHRASES = [
  'So, as we discussed, the periodic table organizes elements by atomic number...',
  'Now let me highlight the transition metals in the middle section...',
  'Great question — noble gases occupy the rightmost group...',
  'Remember, valence electrons determine how elements bond with each other...',
  'That is a really important distinction between atomic number and mass number...',
]

export default function SubtitleTicker({ roomId, active }) {
  const [text, setText] = useState('Listening...')
  const [idx, setIdx] = useState(0)

  // In production: open WebSocket to Amazon Transcribe Streaming
  // Send microphone audio chunks → receive transcript events
  useEffect(() => {
    if (!active) return
    const interval = setInterval(() => {
      setIdx(i => {
        const next = (i + 1) % SAMPLE_PHRASES.length
        setText(SAMPLE_PHRASES[next])
        return next
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [active])

  if (!active) return null

  return (
    <div className="subtitle-ticker">
      <div className="ticker-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Mic size={11} /> CC
      </div>
      <div className="ticker-text">{text}</div>
    </div>
  )
}
