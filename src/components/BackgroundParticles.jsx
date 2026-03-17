import { useEffect, useRef } from 'react'

export default function BackgroundParticles() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    let animationFrameId
    
    // Resize to fit screen
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    const isMobile = window.innerWidth < 768
    const SHAPE_COUNT = isMobile ? 30 : 65
    
    // Modern, ethereal tech color palette
    const colors = [
      'rgba(59, 130, 246, 0.4)',  // Blue
      'rgba(139, 92, 246, 0.4)',  // Purple
      'rgba(6, 182, 212, 0.4)',   // Cyan
      'rgba(255, 255, 255, 0.15)' // Subtle white
    ]
    
    // Abstract geometric shapes
    const shapes = Array.from({ length: SHAPE_COUNT }).map(() => {
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * (isMobile ? 120 : 250) + 50, // Much larger
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 1.2, // Faster drifting so movement is visible
        speedY: (Math.random() - 0.5) * 1.2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.005, // Faster spinning
        type: Math.floor(Math.random() * 3) // 0: circle, 1: softly rounded poly, 2: blurred glow
      }
    })

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // We want these shapes to blend beautifully
      ctx.globalCompositeOperation = 'screen'

      shapes.forEach(s => {
        // Drift
        s.x += s.speedX
        s.y += s.speedY
        s.rotation += s.rotationSpeed

        // Wrap around edges smoothly
        if (s.x < -s.size) s.x = canvas.width + s.size
        if (s.x > canvas.width + s.size) s.x = -s.size
        if (s.y < -s.size) s.y = canvas.height + s.size
        if (s.y > canvas.height + s.size) s.y = -s.size

        ctx.save()
        ctx.translate(s.x, s.y)
        ctx.rotate(s.rotation)

        if (s.type === 0 || s.type === 2) {
          // Soft Glow / Orb
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, s.size / 2)
          gradient.addColorStop(0, s.color)
          gradient.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.globalAlpha = s.type === 2 ? 0.3 : 0.6
          ctx.beginPath()
          ctx.arc(0, 0, s.size, 0, Math.PI * 2)
          ctx.fillStyle = gradient
          ctx.fill()
        } else if (s.type === 1) {
          // Hollow / Wireframe geometric polygon (hexagon-ish)
          ctx.beginPath()
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3
            const px = Math.cos(angle) * (s.size * 0.3)
            const py = Math.sin(angle) * (s.size * 0.3)
            if (i === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          }
          ctx.closePath()
          ctx.strokeStyle = s.color
          ctx.lineWidth = 1
          ctx.globalAlpha = 0.2 // Very faint structural lines
          ctx.stroke()
        }

        ctx.restore()
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1, // Must be 1 to sit above the solid aurora-bg
        mixBlendMode: 'screen' // Blends beautifully with the aurora colors behind it
      }}
    />
  )
}
