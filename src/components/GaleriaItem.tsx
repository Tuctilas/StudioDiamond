/**
 * Item de galeria (foto ou vídeo) com tamanho escolhido pela modelo:
 *  - grande = ocupa 2 colunas, em paisagem (3:2);
 *  - pequeno = 1 coluna, em retrato (3:4).
 * Sem download: vídeo abre/cresce/tela cheia, mas sem baixar; menu de contexto bloqueado.
 * Usado na galeria pública (comum) e na área VIP.
 */
export function GaleriaItem({
  src,
  tipo,
  grande = false,
}: {
  src: string
  tipo: 'image' | 'video'
  grande?: boolean
}) {
  const semMenu = (e: React.MouseEvent) => e.preventDefault()
  const classe = `w-full rounded-xl border border-line object-cover ${
    grande ? 'aspect-[3/2]' : 'aspect-[3/4]'
  }`
  return (
    <div className={grande ? 'col-span-2' : ''}>
      {tipo === 'video' ? (
        <video
          src={src}
          controls
          playsInline
          preload="metadata"
          controlsList="nodownload noremoteplayback noplaybackrate"
          disablePictureInPicture
          onContextMenu={semMenu}
          className={classe}
        />
      ) : (
        <img
          src={src}
          alt=""
          loading="lazy"
          draggable={false}
          onContextMenu={semMenu}
          className={classe}
        />
      )}
    </div>
  )
}
