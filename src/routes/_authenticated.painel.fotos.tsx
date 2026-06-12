import { useEffect, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'

import { supabase } from '#/lib/supabase'
import type { ProfilePhoto } from '#/lib/supabase'
import { useAuth } from '#/lib/useAuth'

export const Route = createFileRoute('/_authenticated/painel/fotos')({
  component: Fotos,
})

const MAX_FOTOS = 20

function Fotos() {
  const { user } = useAuth()
  const [perfilId, setPerfilId] = useState<string | null>(null)
  const [fotos, setFotos] = useState<ProfilePhoto[]>([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!user) return
    carregarEffect()
    async function carregarEffect() {
      const { data: p } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle()
      if (p) {
        setPerfilId(p.id)
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

  async function enviar(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    if (!files.length || !perfilId || !user) return
    if (fotos.length + files.length > MAX_FOTOS) {
      setMsg(`Limite de ${MAX_FOTOS} fotos. Remova alguma antes.`)
      return
    }
    setBusy(true)
    setMsg('Enviando…')
    let ordem = fotos.length
    for (const file of files) {
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, '_')}`
      const { error } = await supabase.storage.from('profile-photos').upload(path, file)
      if (error) {
        setMsg(`Erro no envio: ${error.message}`)
        continue
      }
      const { data: pub } = supabase.storage.from('profile-photos').getPublicUrl(path)
      await supabase.from('profile_photos').insert({
        profile_id: perfilId,
        url: pub.publicUrl,
        ordem: ordem++,
        is_capa: fotos.length === 0 && ordem === 1,
      })
    }
    await recarregar(perfilId)
    setMsg('✅ Fotos enviadas.')
    setBusy(false)
  }

  async function remover(f: ProfilePhoto) {
    if (!perfilId) return
    await supabase.from('profile_photos').delete().eq('id', f.id)
    // tenta apagar do storage também
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
        Até {MAX_FOTOS} fotos. A <b className="text-gold-400">capa</b> aparece nos cards da vitrine.
      </p>

      <label className="mt-6 inline-block cursor-pointer rounded-xl border border-gold-500/40 px-6 py-3 text-sm font-semibold text-gold-400 transition hover:bg-gold-500/10">
        + Enviar fotos
        <input type="file" accept="image/*" multiple onChange={enviar} className="hidden" disabled={busy} />
      </label>
      {msg && <p className="mt-3 text-sm text-gold-400">{msg}</p>}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {fotos.map((f) => (
          <div
            key={f.id}
            className={`relative overflow-hidden rounded-xl border ${
              f.is_capa ? 'border-gold-500' : 'border-line'
            }`}
          >
            <img src={f.url} alt="" className="aspect-[3/4] w-full object-cover" />
            {f.is_capa && (
              <span className="absolute left-2 top-2 rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-bold uppercase text-noir-950">
                Capa
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-noir-950/85 p-2 text-xs">
              {!f.is_capa ? (
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
      {!fotos.length && (
        <p className="mt-6 text-sm text-muted">Nenhuma foto ainda — envie a primeira!</p>
      )}
    </div>
  )
}
