/**
 * Item de galeria (foto ou vídeo) com tamanho escolhido pela modelo:
 *  - grande = ocupa 2 colunas (fica em paisagem por ser mais larga);
 *  - pequeno = 1 coluna (fica em retrato por ser mais estreita).
 * Todas têm a MESMA altura para alinhar as bordas de baixo na grade — só a
 * largura muda (a grande inclui o vão entre as 2 colunas). Sem download:
 * vídeo abre/cresce/tela cheia, mas sem baixar; menu de contexto bloqueado.
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
  const classe = 'h-64 w-full rounded-xl border border-line object-cover sm:h-72 md:h-80'
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
