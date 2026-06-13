import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { enviarElogio, getElogiosPublicos, getProfilesParaSelect } from '#/lib/queries'
import type { ElogioPublico } from '#/lib/supabase'

export const Route = createFileRoute('/elogios')({
  loader: async () => {
    const [elogios, modelos] = await Promise.all([
      getElogiosPublicos(),
      getProfilesParaSelect(),
    ])
    return { elogios, modelos }
  },
  head: () => ({
    meta: [
      { title: 'Elogios — Studio Diamond' },
      {
        name: 'description',
        content:
          'Deixe seu elogio às modelos do Studio Diamond. Depoimentos elegantes e respeitosos, publicados após curadoria.',
      },
    ],
  }),
  component: Elogios,
})

function Elogios() {
  const { elogios, modelos } = Route.useLoaderData()
  const [lista] = useState<ElogioPublico[]>(elogios)
  const [form, setForm] = useState({ mensagem: '', nome: '', email: '', profile_id: '' })
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
      profile_id: form.profile_id || null,
    })
    setBusy(false)
    if (error) {
      setErro('Não foi possível enviar agora. Tente novamente em instantes.')
      return
    }
    setEnviado(true)
    setForm({ mensagem: '', nome: '', email: '', profile_id: '' })
  }

  const input =
    'w-full rounded-xl border border-line bg-noir-800 px-4 py-3 text-sm outline-none focus:border-gold-500'

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="font-display text-4xl text-gold-300">Deixe seu Elogio ✨</h1>

      {/* DOIS BLOCOS DE TEXTO */}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-gold-500/20 bg-noir-900/60 p-6">
          <p className="font-display text-lg text-ink">Sua experiência merece ser registrada.</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Este espaço é dedicado a você que viveu um momento especial com uma de nossas modelos e
            quer reconhecer publicamente o brilho dela.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Escreva seu elogio ou depoimento abaixo — uma palavra sua vale ouro para quem se dedica
            a encantar.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-noir-900/60 p-6">
          <p className="font-display text-lg text-gold-400">Importante</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Este <span className="text-ink">não é um canal de contato</span> com as modelos. Elas
            não respondem por aqui. Toda comunicação deve ser feita exclusivamente pelos canais
            indicados no perfil de cada uma.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Publicamos apenas mensagens elogiosas e respeitosas, após curadoria. Críticas, ofensas
            ou tentativas de contato serão descartadas.
          </p>
        </div>
      </div>

      {/* FORMULÁRIO */}
      {enviado ? (
        <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
          <div className="text-3xl">✨</div>
          <p className="mt-3 font-display text-xl text-ink">Elogio enviado!</p>
          <p className="mt-1 text-sm text-muted">
            Obrigado pelo carinho. Sua mensagem passa por uma curadoria rápida antes de aparecer
            aqui.
          </p>
          <button
            onClick={() => setEnviado(false)}
            className="mt-5 text-sm text-gold-400 underline"
          >
            Escrever outro
          </button>
        </div>
      ) : (
        <form onSubmit={publicar} className="mt-8 space-y-4">
          <textarea
            value={form.mensagem}
            onChange={(e) => set('mensagem', e.target.value)}
            rows={6}
            className={input}
            placeholder="Conte o que tornou seu encontro inesquecível…"
          />
          {modelos.length > 0 && (
            <select
              value={form.profile_id}
              onChange={(e) => set('profile_id', e.target.value)}
              className={input}
            >
              <option value="">Sobre qual modelo? (opcional)</option>
              {modelos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome_exibicao}
                </option>
              ))}
            </select>
          )}
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

          <div className="flex flex-col items-end gap-2">
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

      {/* ELOGIOS PUBLICADOS */}
      {lista.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl">O que dizem por aqui</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {lista.map((el) => (
              <figure
                key={el.id}
                className="rounded-2xl border border-line bg-noir-900/60 p-6"
              >
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
        </section>
      )}
    </div>
  )
}
