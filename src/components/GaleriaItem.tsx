import { useState } from 'react'

/**
 * Item de galeria (foto ou vídeo) com:
 *  - orientação automática: retrato fica menor (1 coluna), paisagem ocupa a largura toda;
 *  - sem download: vídeo abre/cresce/tela cheia, mas sem botão de baixar; bloqueia menu de contexto.
 * Usado tanto na galeria pública (comum) quanto na área VIP.
 */
export function GaleriaItem({ src, tipo }: { src: string; tipo: 'image' | 'video' }) {
  const [paisagem, setPaisagem] = useState(false)
  const semMenu = (e: React.MouseEvent) => e.preventDefault()
  const classe = `w-full rounded-xl border border-line object-cover ${
    paisagem ? 'aspect-[3/2]' : 'aspect-[2/3]'
  }`
  return (
    <div className={paisagem ? 'col-span-full' : ''}>
      {tipo === 'video' ? (
        <video
          src={src}
          controls
          playsInline
          preload="metadata"
          controlsList="nodownload noremoteplayback noplaybackrate"
          disablePictureInPicture
          onContextMenu={semMenu}
          onLoadedMetadata={(e) =>
            setPaisagem(e.currentTarget.videoWidth > e.currentTarget.videoHeight)
          }
          className={classe}
        />
      ) : (
        <img
          src={src}
          alt=""
          loading="lazy"
          draggable={false}
          onContextMenu={semMenu}
          onLoad={(e) => setPaisagem(e.currentTarget.naturalWidth > e.currentTarget.naturalHeight)}
          className={classe}
        />
      )}
    </div>
  )
}
