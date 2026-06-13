import { useState } from 'react'

import { enviarElogio } from '#/lib/queries'
import type { ElogioPublico } from '#/lib/supabase'

/** Bloco de elogios na página de uma modelo: depoimentos aprovados + formulário. */
export function ElogiosModelo({
  profileId,
  nome,
  iniciais,
}: {
  profileId: string
  nome: string
  iniciais: ElogioPublico[]
}) {
  const [form, setForm] = useState({ mensagem: '', nome: '', email: '' })
  const [busy, setBusy] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function publicar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (form.mensagem.trim().length < 10) {
      setErro('Escreva um elogio com pelo menos algumas palavras.')
      return
    }
    setBusy(true)
    const { error } = await enviarElogio({
      mensagem: form.mensagem.trim(),
      nome: form.nome.trim(),
      email: form.email.trim(),
      profile_id: profileId,
    })
    setBusy(false)
    if (error) {
      setErro('Não foi possível enviar agora. Tente novamente em instantes.')
      return
    }
    setEnviado(true)
    setForm({ mensagem: '', nome: '', email: '' })
  }

  const input =
    'w-full rounded-xl border border-line bg-noir-800 px-4 py-3 text-sm outline-none focus:border-gold-500'

  return (
    <section className="mt-16 border-t border-line pt-12">
      <h2 className="font-display text-3xl">Elogios sobre {nome} ✨</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Viveu um momento especial com {nome}? Registre seu elogio. Este não é um canal de contato —
        ela não responde por aqui; publicamos apenas mensagens respeitosas, após curadoria.
      </p>

      {/* DEPOIMENTOS APROVADOS */}
      {iniciais.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {iniciais.map((el) => (
            <figure key={el.id} className="rounded-2xl border border-line bg-noir-900/60 p-6">
              <blockquote className="text-sm leading-relaxed text-ink">“{el.mensagem}”</blockquote>
              <figcaption className="mt-4 text-xs uppercase tracking-wider text-gold-400">
                {el.nome?.trim() || 'Anônimo'}
                <span className="ml-2 font-normal normal-case text-muted">
                  {new Date(el.created_at).toLocaleDateString('pt-BR')}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {/* FORMULÁRIO */}
      {enviado ? (
        <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
          <div className="text-3xl">✨</div>
          <p className="mt-3 font-display text-xl text-ink">Elogio enviado!</p>
          <p className="mt-1 text-sm text-muted">
            Obrigado pelo carinho. Sua mensagem passa por uma curadoria rápida antes de aparecer
            aqui.
          </p>
          <button onClick={() => setEnviado(false)} className="mt-5 text-sm text-gold-400 underline">
            Escrever outro
          </button>
        </div>
      ) : (
        <form onSubmit={publicar} className="mt-8 max-w-2xl space-y-4">
          <textarea
            value={form.mensagem}
            onChange={(e) => set('mensagem', e.target.value)}
            rows={5}
            className={input}
            placeholder={`Conte o que tornou seu encontro com ${nome} inesquecível…`}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              value={form.nome}
              onChange={(e) => set('nome', e.target.value)}
              className={input}
              placeholder="Nome (deixe em branco para Anônimo)"
            />
            <input
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              type="email"
              className={input}
              placeholder="E-mail (nunca exibido)"
            />
          </div>

          {erro && <p className="text-sm text-red-400">{erro}</p>}

          <div className="flex flex-col items-start gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-gradient-to-r from-gold-500 to-gold-700 px-8 py-4 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {busy ? 'Enviando…' : 'Enviar Elogio ✨'}
            </button>
            <p className="text-xs text-muted">
              Seu nome pode aparecer como <span className="text-ink">Anônimo</span> se preferir.
              E-mail nunca é exibido.
            </p>
          </div>
        </form>
      )}
    </section>
  )
}
