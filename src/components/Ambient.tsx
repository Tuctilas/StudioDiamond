import { useEffect, useRef } from 'react'

/** Palco do site antigo: silhueta dançando + fumaça + luzes douradas.
 *  A fumaça (14 MB) só carrega no desktop, depois da página pronta. */
export function Ambient() {
  const dancerRef = useRef<HTMLVideoElement>(null)
  const smokeRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const dancer = dancerRef.current
    if (dancer) {
      dancer.muted = true // React nem sempre reflete o atributo; sem mute o autoplay é bloqueado
      dancer.playbackRate = 0.5 // dançarina mais devagar
      const tentar = () => {
        dancer.play().catch(() => {})
      }
      tentar()
      // navegadores que seguram o autoplay: retenta quando der (dados prontos / 1º toque)
      dancer.addEventListener('canplay', tentar, { once: true })
      document.addEventListener('pointerdown', tentar, { once: true })
    }

    // fumaça: só desktop, depois do load (é pesada)
    const smoke = smokeRef.current
    if (!smoke || !window.matchMedia('(min-width: 761px)').matches) return
    function carregarFumaca() {
      if (!smoke || smoke.src) return
      smoke.muted = true
      smoke.src = '/media/smoke.mp4'
      smoke.load()
      smoke.playbackRate = 0.6
      smoke.play().catch(() => {})
    }
    if (document.readyState === 'complete') carregarFumaca()
    else {
      window.addEventListener('load', carregarFumaca, { once: true })
      return () => window.removeEventListener('load', carregarFumaca)
    }
  }, [])

  return (
    <div className="ambient" aria-hidden="true">
      <video
        ref={dancerRef}
        className="dancer-video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      >
        <source src="/media/bg-dance.mp4" type="video/mp4" />
      </video>
      <video ref={smokeRef} className="smoke-video" muted loop playsInline preload="none" />
      <div className="fog" />
      <div className="stage-tint" />
      <div className="gold-wash" />
      <div className="orb a" />
      <div className="orb b" />
    </div>
  )
}
