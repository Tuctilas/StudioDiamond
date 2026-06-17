import { useEffect, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'

import { supabase } from '#/lib/supabase'
import type { ProfilePhoto } from '#/lib/supabase'
import { useAuth } from '#/lib/useAuth'

export const Route = createFileRoute('/_authenticated/painel/fotos')({
  component: Fotos,
})

const MAX_FOTOS = 20

interface Pendente {
  file: File
  preview: string
  tipo: 'image' | 'video'
}

function Fotos() {
  const { user } = useAuth()
  const [perfilId, setPerfilId] = useState<string | null>(null)
  const [fotos, setFotos] = useState<ProfilePhoto[]>([])
  const [pendentes, setPendentes] = useState<Pendente[]>([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [videoCapa, setVideoCapa] = useState<string | null>(null)
  const [videoPendente, setVideoPendente] = useState<{ file: File; preview: string } | null>(null)

  useEffect(() => {
    if (!user) return
    carregarEffect()
    async function carregarEffect() {
      const { data: p } = await supabase
        .from('profiles')
        .select('id, capa_video_url')
        .eq('user_id', user!.id)
        .maybeSingle()
      if (p) {
        setPerfilId(p.id)
        setVideoCapa(p.capa_video_url)
        await recarregar(p.id)
      }
      setCarregando(false)
    }
  }, [user])

  async function recarregar(id: string) {
    const { data } = await supabase
      .from('profile_photos')
      .select('*')
      .eq('profile_id', id)
      .order('ordem')
    setFotos(data ?? [])
  }

  // Selecionar NÃO publica: só prepara as fotos para revisão.
  function selecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    if (!files.length) return
    if (fotos.length + pendentes.length + files.length > MAX_FOTOS) {
      setMsg(`Limite de ${MAX_FOTOS} fotos no total.`)
      return
    }
    setMsg('')
    setPendentes((prev) => [
      ...prev,
      ...files.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        tipo: (file.type.startsWith('video') ? 'video' : 'image') as 'image' | 'video',
      })),
    ])
  }

  function removerPendente(i: number) {
    setPendentes((prev) => {
      URL.revokeObjectURL(prev[i].preview)
      return prev.filter((_, idx) => idx !== i)
    })
  }

  function limparPendentes() {
    pendentes.forEach((p) => URL.revokeObjectURL(p.preview))
    setPendentes([])
  }

  // Só aqui as fotos vão de fato para o ar.
  async function publicar() {
    if (!pendentes.length || !perfilId || !user) return
    setBusy(true)
    setMsg('Publicando…')
    let ordem = fotos.length
    // capa é sempre uma imagem; vídeo nunca vira capa do card
    let semCapa = !fotos.some((f) => f.tipo !== 'video')
    for (const { file, tipo } of pendentes) {
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, '_')}`
      const { error } = await supabase.storage.from('profile-photos').upload(path, file)
      if (error) {
        setMsg(`Erro no envio: ${error.message}`)
        continue
      }
      const { data: pub } = supabase.storage.from('profile-photos').getPublicUrl(path)
      const ehCapa = semCapa && tipo === 'image'
      await supabase.from('profile_photos').insert({
        profile_id: perfilId,
        url: pub.publicUrl,
        ordem: ordem++,
        is_capa: ehCapa,
        tipo,
      })
      if (ehCapa) semCapa = false
    }
    limparPendentes()
    await recarregar(perfilId)
    setMsg('✅ Fotos publicadas.')
    setBusy(false)
  }

  async function remover(f: ProfilePhoto) {
    if (!perfilId) return
    await supabase.from('profile_photos').delete().eq('id', f.id)
    const marca = '/profile-photos/'
    const i = f.url.indexOf(marca)
    if (i >= 0) {
      const path = decodeURIComponent(f.url.slice(i + marca.length).split('?')[0])
      await supabase.storage.from('profile-photos').remove([path])
    }
    await recarregar(perfilId)
  }

  async function definirCapa(f: ProfilePhoto) {
    if (!perfilId) return
    await supabase.from('profile_photos').update({ is_capa: false }).eq('profile_id', perfilId)
    await supabase.from('profile_photos').update({ is_capa: true }).eq('id', f.id)
    await recarregar(perfilId)
  }

  // Vídeo de capa: selecionar só prepara; publicar é que envia.
  function selecionarVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (videoPendente) URL.revokeObjectURL(videoPendente.preview)
    setVideoPendente({ file, preview: URL.createObjectURL(file) })
    setMsg('')
  }

  async function publicarVideo() {
    if (!videoPendente || !perfilId || !user) return
    setBusy(true)
    setMsg('Enviando vídeo…')
    const f = videoPendente.file
    const path = `${user.id}/capa-video-${Date.now()}-${f.name.replace(/[^a-z0-9.\-_]/gi, '_')}`
    const { error } = await supabase.storage.from('profile-photos').upload(path, f)
    if (error) {
      setMsg(`Erro: ${error.message}`)
      setBusy(false)
      return
    }
    const { data: pub } = supabase.storage.from('profile-photos').getPublicUrl(path)
    const { error: e2 } = await supabase
      .from('profiles')
      .update({ capa_video_url: pub.publicUrl })
      .eq('id', perfilId)
    if (e2) {
      setMsg(e2.message)
      setBusy(false)
      return
    }
    URL.revokeObjectURL(videoPendente.preview)
    setVideoPendente(null)
    setVideoCapa(pub.publicUrl)
    setMsg('✅ Vídeo de capa publicado.')
    setBusy(false)
  }

  async function removerVideo() {
    if (!perfilId) return
    await supabase.from('profiles').update({ capa_video_url: null }).eq('id', perfilId)
    if (videoCapa) {
      const marca = '/profile-photos/'
      const i = videoCapa.indexOf(marca)
      if (i >= 0) {
        const p = decodeURIComponent(videoCapa.slice(i + marca.length).split('?')[0])
        await supabase.storage.from('profile-photos').remove([p])
      }
    }
    setVideoCapa(null)
  }

  if (carregando) return <p className="text-sm text-muted">Carregando…</p>

  if (!perfilId) {
    return (
      <div className="rounded-2xl border border-line bg-noir-900 p-10 text-center text-sm text-muted">
        Crie seu perfil primeiro.{' '}
        <Link to="/painel/perfil" className="text-gold-400 underline">
          Criar perfil →
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display text-3xl">Galeria</h1>
      <p className="mt-1 text-sm text-muted">
        Até {MAX_FOTOS} mídias (fotos e vídeos). A <b className="text-gold-400">capa</b> aparece nos
        cards da vitrine. As mídias só vão ao ar depois que você clicar em <b>Publicar</b>.
      </p>

      {/* VÍDEO DE CAPA */}
      <div className="mt-6 rounded-2xl border border-line bg-noir-900/50 p-5">
        <h2 className="font-display text-lg">Vídeo de capa (opcional)</h2>
        <p className="mt-1 text-xs text-muted">
          Se enviar um vídeo, ele vira a mídia principal na vitrine e no seu perfil (no lugar da
          foto de capa).
        </p>
        {videoPendente ? (
          <div className="mt-4">
            <video
              src={videoPendente.preview}
              controls
              muted
              className="aspect-[3/4] w-48 rounded-xl object-cover"
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={publicarVideo}
                disabled={busy}
                className="rounded-lg bg-gradient-to-r from-gold-500 to-gold-700 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {busy ? 'Enviando…' : 'Publicar vídeo'}
              </button>
              <button
                onClick={() => {
                  URL.revokeObjectURL(videoPendente.preview)
                  setVideoPendente(null)
                }}
                className="rounded-lg border border-line px-4 py-2 text-sm text-muted transition hover:text-ink"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : videoCapa ? (
          <div className="mt-4">
            <video src={videoCapa} controls muted className="aspect-[3/4] w-48 rounded-xl object-cover" />
            <div className="mt-3 flex gap-2">
              <label className="cursor-pointer rounded-lg border border-gold-500/40 px-4 py-2 text-sm font-semibold text-gold-400 transition hover:bg-gold-500/10">
                Trocar vídeo
                <input type="file" accept="video/*" onChange={selecionarVideo} className="hidden" disabled={busy} />
              </label>
              <button
                onClick={removerVideo}
                disabled={busy}
                className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
              >
                Remover vídeo
              </button>
            </div>
          </div>
        ) : (
          <label className="mt-4 inline-block cursor-pointer rounded-xl border border-gold-500/40 px-6 py-3 text-sm font-semibold text-gold-400 transition hover:bg-gold-500/10">
            + Selecionar vídeo de capa
            <input type="file" accept="video/*" onChange={selecionarVideo} className="hidden" disabled={busy} />
          </label>
        )}
      </div>

      <label className="mt-6 inline-block cursor-pointer rounded-xl border border-gold-500/40 px-6 py-3 text-sm font-semibold text-gold-400 transition hover:bg-gold-500/10">
        + Selecionar fotos/vídeos
        <input type="file" accept="image/*,video/*" multiple onChange={selecionar} className="hidden" disabled={busy} />
      </label>
      {msg && <p className="mt-3 text-sm text-gold-400">{msg}</p>}

      {/* PARA PUBLICAR (revisão) */}
      {pendentes.length > 0 && (
        <div className="mt-6 rounded-2xl border border-gold-500/30 bg-gold-500/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg text-gold-300">
              Para publicar ({pendentes.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={limparPendentes}
                disabled={busy}
                className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:text-ink"
              >
                Limpar
              </button>
              <button
                onClick={publicar}
                disabled={busy}
                className="rounded-lg bg-gradient-to-r from-gold-500 to-gold-700 px-4 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {busy ? 'Publicando…' : `Publicar ${pendentes.length} item(ns)`}
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {pendentes.map((p, i) => (
              <div key={i} className="relative overflow-hidden rounded-xl border border-gold-500/40">
                {p.tipo === 'video' ? (
                  <video src={p.preview} muted className="aspect-[3/4] w-full object-cover" />
                ) : (
                  <img src={p.preview} alt="" className="aspect-[3/4] w-full object-cover" />
                )}
                <button
                  onClick={() => removerPendente(i)}
                  className="absolute right-1 top-1 rounded-full bg-noir-950/85 px-2 py-0.5 text-xs text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PUBLICADAS */}
      {fotos.length > 0 && <h2 className="mt-8 font-display text-lg">Publicadas</h2>}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {fotos.map((f) => (
          <div
            key={f.id}
            className={`relative overflow-hidden rounded-xl border ${
              f.is_capa ? 'border-gold-500' : 'border-line'
            }`}
          >
            {f.tipo === 'video' ? (
              <video src={f.url} controls muted className="aspect-[3/4] w-full object-cover" />
            ) : (
              <img src={f.url} alt="" className="aspect-[3/4] w-full object-cover" />
            )}
            {f.is_capa && (
              <span className="absolute left-2 top-2 rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-bold uppercase text-noir-950">
                Capa
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-noir-950/85 p-2 text-xs">
              {!f.is_capa && f.tipo !== 'video' ? (
                <button onClick={() => definirCapa(f)} className="text-gold-400 hover:underline">
                  ★ capa
                </button>
              ) : (
                <span />
              )}
              <button onClick={() => remover(f)} className="text-red-400 hover:underline">
                remover
              </button>
            </div>
          </div>
        ))}
      </div>
      {!fotos.length && !pendentes.length && (
        <p className="mt-6 text-sm text-muted">Nenhuma foto ainda — selecione a primeira!</p>
      )}
    </div>
  )
}
