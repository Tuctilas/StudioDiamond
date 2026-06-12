import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/privacidade')({
  head: () => ({
    meta: [
      { title: 'Política de Privacidade — Studio Diamond' },
      { name: 'description', content: 'Política de privacidade da plataforma Studio Diamond (LGPD).' },
    ],
  }),
  component: Privacidade,
})

function Privacidade() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 text-sm leading-relaxed text-muted">
      <h1 className="font-display text-3xl text-ink">Política de Privacidade</h1>
      <p className="mt-4">
        Esta política descreve como o Studio Diamond trata dados pessoais, em
        conformidade com a <b>LGPD</b> (Lei 13.709/2018).
      </p>
      <h2 className="mt-8 font-display text-xl text-ink">Dados coletados</h2>
      <p>
        De visitantes: nenhum dado pessoal é coletado — apenas a confirmação
        de idade fica salva no seu navegador. De anunciantes: e-mail de login,
        dados do anúncio e documento de verificação de idade (acesso restrito
        à moderação).
      </p>
      <h2 className="mt-8 font-display text-xl text-ink">Uso dos dados</h2>
      <p>
        Os dados dos anunciantes são usados exclusivamente para operar a
        plataforma: autenticação, publicação do anúncio e verificação de
        idade. Não vendemos nem compartilhamos dados com terceiros.
      </p>
      <h2 className="mt-8 font-display text-xl text-ink">Seus direitos</h2>
      <p>
        Anunciantes podem corrigir ou excluir seus dados a qualquer momento
        pelo painel, incluindo a exclusão completa da conta. Para exercer
        qualquer direito previsto na LGPD, use os canais de contato da
        plataforma.
      </p>
    </div>
  )
}
