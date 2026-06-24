import { useRef, useState } from 'react'

export type Foco = { x: number; y: number }

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)))

/**
 * Editor de enquadramento: mostra a mídia no formato em que será exibida
 * (3:4, object-cover) e a modelo arrasta para escolher o ponto de foco —
 * assim o rosto não fica cortado. Salva foco em % (object-position).
 */
export function EnquadrarFoto({
  src,
  tipo,
  foco,
  onSalvar,
  onFechar,
}: {
  src: string
  tipo: 'image' | 'video'
  foco: Foco
  onSalvar: (f: Foco) => void
  onFechar: () => void
}) {
  const [pos, setPos] = useState<Foco>(foco)
  const ref = useRef<HTMLDivElement>(null)
  const arrastando = useRef(false)

  function mover(clientX: number, clientY: number) {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    setPos({
      x: clamp(((clientX - r.left) / r.width) * 100),
      y: clamp(((clientY - r.top) / r.height) * 100),
    })
  }

  const estilo = { objectPosition: `${pos.x}% ${pos.y}%` }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={onFechar}>
      <div
        className="w-full max-w-sm rounded-2xl border border-gold-500/40 bg-noir-900 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg text-gold-300">Enquadrar</h3>
        <p className="mt-1 text-xs text-muted">
          Arraste sobre a foto e solte no ponto que deve aparecer (ex.: o rosto). É assim que ela
          aparece nos cards e na galeria.
        </p>

        <div
          ref={ref}
          className="relative mx-auto mt-4 aspect-[3/4] w-60 max-w-full cursor-crosshair touch-none overflow-hidden rounded-xl border border-line bg-noir-800"
          onPointerDown={(e) => {
            arrastando.current = true
            ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
            mover(e.clientX, e.clientY)
          }}
          onPointerMove={(e) => {
            if (arrastando.current) mover(e.clientX, e.clientY)
          }}
          onPointerUp={() => {
            arrastando.current = false
          }}
        >
          {tipo === 'video' ? (
            <video src={src} muted playsInline className="pointer-events-none h-full w-full object-cover" style={estilo} />
          ) : (
            <img src={src} alt="" draggable={false} className="pointer-events-none h-full w-full object-cover" style={estilo} />
          )}

          {/* grade de terços */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/3 top-0 h-full w-px bg-white/30" />
            <div className="absolute left-2/3 top-0 h-full w-px bg-white/30" />
            <div className="absolute top-1/3 left-0 w-full h-px bg-white/30" />
            <div className="absolute top-2/3 left-0 w-full h-px bg-white/30" />
          </div>

          {/* marcador do foco */}
          <div
            className="pointer-events-none absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold-400 bg-gold-400/20 shadow"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          />
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            onClick={() => setPos({ x: 50, y: 50 })}
            className="rounded-lg border border-line px-3 py-2 text-xs text-muted transition hover:text-ink"
          >
            Centralizar
          </button>
          <div className="flex gap-2">
            <button
              onClick={onFechar}
              className="rounded-lg border border-line px-3 py-2 text-sm text-muted transition hover:text-ink"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSalvar(pos)}
              className="rounded-lg bg-gradient-to-r from-gold-500 to-gold-700 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
