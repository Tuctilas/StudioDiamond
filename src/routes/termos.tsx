import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/termos')({
  head: () => ({
    meta: [
      { title: 'Termos de Uso — Studio Diamond' },
      { name: 'description', content: 'Termos de uso da plataforma Studio Diamond.' },
    ],
  }),
  component: Termos,
})

function Termos() {
  return (
    <div className="prose prose-invert mx-auto max-w-3xl px-5 py-12 text-sm leading-relaxed text-muted [&_h1]:font-display [&_h1]:text-ink [&_h2]:font-display [&_h2]:text-ink">
      <h1 className="font-display text-3xl text-ink">Termos de Uso</h1>
      <p className="mt-4">
        Ao acessar o Studio Diamond, você declara ter <b>18 anos ou mais</b> e concorda
        com estes termos.
      </p>
      <h2 className="mt-8 text-xl">1. Natureza do serviço</h2>
      <p>
        O Studio Diamond é uma plataforma de <b>classificados de anúncios pessoais</b>{' '}
        publicados por anunciantes independentes, maiores de idade. O Studio Diamond
        não intermedeia, agencia ou participa de qualquer acordo entre
        anunciantes e usuários, nem recebe comissão sobre encontros.
      </p>
      <h2 className="mt-8 text-xl">2. Responsabilidade dos anunciantes</h2>
      <p>
        Cada anunciante é exclusivamente responsável pelo conteúdo do próprio
        anúncio, pela veracidade das informações e pelas fotos publicadas, e
        declara ser maior de 18 anos, com documento verificado pela moderação
        antes da publicação.
      </p>
      <h2 className="mt-8 text-xl">3. Conteúdo proibido</h2>
      <p>
        É terminantemente proibido: conteúdo envolvendo menores de idade,
        tráfico ou exploração de pessoas, conteúdo sem consentimento, e
        qualquer atividade ilegal. Denúncias resultam em remoção imediata e
        comunicação às autoridades.
      </p>
      <h2 className="mt-8 text-xl">4. Remoção de conteúdo</h2>
      <p>
        Anunciantes podem pausar ou excluir o próprio anúncio a qualquer
        momento pelo painel. Terceiros podem solicitar remoção de conteúdo
        pelos canais de contato.
      </p>
    </div>
  )
}
