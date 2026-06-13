import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/termos')({
  head: () => ({
    meta: [
      { title: 'Termos de Uso — Studio Diamond' },
      {
        name: 'description',
        content:
          'Termos de uso do Studio Diamond: plataforma de anúncios, verificação de anunciantes, direitos de imagem e regras de conteúdo.',
      },
    ],
  }),
  component: Termos,
})

function Item({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl text-ink">{titulo}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  )
}

function Termos() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 text-sm leading-relaxed text-muted">
      <h1 className="font-display text-3xl text-ink">Termos de Uso</h1>
      <p className="mt-4">
        Ao acessar ou utilizar o Studio Diamond, você declara ter <b>18 anos ou mais</b> e concorda
        integralmente com estes Termos. Se não concorda, não utilize a plataforma. Anunciantes
        aceitam estes Termos de forma expressa no momento do cadastro, com registro de data e hora.
      </p>

      <Item titulo="1. O que é o Studio Diamond">
        <p>
          O Studio Diamond é uma <b>plataforma de classificados</b> que hospeda anúncios pessoais
          publicados por anunciantes adultas e independentes. <b>Não somos agência</b>, não
          empregamos, não representamos e não intermediamos encontros, serviços ou pagamentos entre
          anunciantes e usuários. Não recebemos comissão sobre eventuais encontros — nossa receita
          vem exclusivamente dos planos de publicação contratados pelas anunciantes e de assinaturas
          de conteúdo, quando aplicável.
        </p>
        <p>
          Valores, locais, dias, horários e a natureza de qualquer combinação são tratados direta e
          exclusivamente entre anunciante e usuário, sob responsabilidade integral de ambos. O
          Studio Diamond não participa, não fiscaliza e não se responsabiliza por essas tratativas.
        </p>
      </Item>

      <Item titulo="2. Verificação da anunciante">
        <p>Para publicar, a anunciante deve, no cadastro:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>confirmar ser maior de 18 anos;</li>
          <li>enviar documento oficial com foto (RG, CNH ou Passaporte);</li>
          <li>enviar um breve vídeo de identificação e autorização de uso de imagem;</li>
          <li>aceitar expressamente estes Termos.</li>
        </ul>
        <p>
          Esses dados de verificação são <b>confidenciais</b>, armazenados em área restrita e
          acessíveis apenas à equipe de moderação para fins de conferência. A publicação só ocorre
          após a aprovação da moderação.
        </p>
      </Item>

      <Item titulo="3. Responsabilidade pelo conteúdo">
        <p>
          Cada anunciante é a <b>única e exclusiva responsável</b> pelo conteúdo do próprio anúncio —
          textos, fotos, vídeos e áudios — e pela veracidade das informações. Ao publicar, a
          anunciante declara que as imagens são suas e que detém todos os direitos ou autorizações
          necessárias para divulgá-las, isentando o Studio Diamond de qualquer reivindicação de
          terceiros.
        </p>
      </Item>

      <Item titulo="4. Direitos autorais e de imagem">
        <p>
          Os direitos autorais de fotos e vídeos pertencem a quem os produziu (o fotógrafo ou
          criador). Cabe à anunciante garantir que possui autorização para publicar o material. O
          Studio Diamond respeita esses direitos, não guarda cópia de segurança do material e não é
          fonte de recuperação de arquivos. Pedidos de remoção por uso indevido de imagem podem ser
          feitos pelos nossos canais de contato e são tratados com prioridade.
        </p>
      </Item>

      <Item titulo="5. Conteúdo proibido">
        <p>É terminantemente proibido publicar:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>qualquer conteúdo envolvendo menores de 18 anos ou que aparente menoridade;</li>
          <li>conteúdo sem o consentimento da pessoa retratada;</li>
          <li>material que indique tráfico, exploração ou coação de pessoas;</li>
          <li>imagens de terceiros, fotos falsas ou que não correspondam à anunciante;</li>
          <li>qualquer atividade ilegal.</li>
        </ul>
        <p>
          Denúncias resultam em remoção imediata e, quando cabível, comunicação às autoridades
          competentes.
        </p>
      </Item>

      <Item titulo="6. Diretrizes de qualidade (veto)">
        <p>
          Para preservar a credibilidade da vitrine, podemos recusar ou não renovar anúncios que, a
          nosso critério, não atendam ao padrão do site — por exemplo, fotos com clientes, sem
          resolução adequada, com símbolos religiosos, militares ou de outra natureza sensível, ou
          que não representem interesse compatível com a plataforma.
        </p>
      </Item>

      <Item titulo="7. Publicação, planos e remoção">
        <p>
          A anunciante pode <b>pausar ou excluir</b> o próprio anúncio a qualquer momento pelo
          painel. O Studio Diamond pode interromper a publicação de qualquer anúncio em caso de
          violação destes Termos, denúncias fundamentadas ou término do plano contratado, sem que a
          comunicação prévia seja obrigatória nesses casos.
        </p>
      </Item>

      <Item titulo="8. Privacidade e dados">
        <p>
          Tratamos dados pessoais conforme a legislação aplicável (LGPD). Documentos e vídeos de
          verificação têm acesso restrito e finalidade exclusiva de conferência de identidade e
          maioridade. Consulte também a nossa{' '}
          <a href="/privacidade" className="text-gold-400 underline">
            Política de Privacidade
          </a>
          .
        </p>
      </Item>

      <Item titulo="9. Limitação de responsabilidade">
        <p>
          O Studio Diamond fornece apenas o espaço de publicação. Não garantimos a conduta de
          anunciantes ou usuários e não nos responsabilizamos por danos decorrentes de contatos,
          encontros ou negociações realizados a partir dos anúncios. O uso da plataforma é por conta
          e risco de cada parte.
        </p>
      </Item>

      <Item titulo="10. Alterações e foro">
        <p>
          Estes Termos podem ser atualizados a qualquer momento; a versão vigente é a publicada nesta
          página. Questões não resolvidas amigavelmente serão dirimidas no foro da comarca da sede da
          plataforma.
        </p>
      </Item>

      <p className="mt-10 text-xs text-muted">Última atualização: junho de 2026.</p>
    </div>
  )
}
