// Capitais atendidas. Adicionar/remover aqui atualiza rotas, seletor e sitemap.
export interface CidadeInfo {
  slug: string
  nome: string
  estado: string
  /** Texto curto único por cidade (SEO) */
  seo: string
}

export const CIDADES: CidadeInfo[] = [
  { slug: 'sao-paulo', nome: 'São Paulo', estado: 'SP', seo: 'Acompanhantes de luxo em São Paulo: perfis verificados nos Jardins, Moema, Itaim e região da Paulista, com contato direto pelo WhatsApp.' },
  { slug: 'rio-de-janeiro', nome: 'Rio de Janeiro', estado: 'RJ', seo: 'As acompanhantes mais desejadas do Rio de Janeiro: Copacabana, Ipanema, Barra da Tijuca e Centro, com atendimento discreto.' },
  { slug: 'belo-horizonte', nome: 'Belo Horizonte', estado: 'MG', seo: 'Acompanhantes em Belo Horizonte com perfis verificados: Savassi, Lourdes, Buritis e região central.' },
  { slug: 'brasilia', nome: 'Brasília', estado: 'DF', seo: 'Acompanhantes de alto nível em Brasília: Asa Sul, Asa Norte e Águas Claras, com discrição absoluta.' },
  { slug: 'curitiba', nome: 'Curitiba', estado: 'PR', seo: 'Acompanhantes em Curitiba: Batel, Centro e Água Verde, perfis com fotos reais e contato direto.' },
  { slug: 'porto-alegre', nome: 'Porto Alegre', estado: 'RS', seo: 'Acompanhantes em Porto Alegre: Moinhos de Vento, Centro Histórico e Cidade Baixa.' },
  { slug: 'salvador', nome: 'Salvador', estado: 'BA', seo: 'Acompanhantes em Salvador: Barra, Ondina, Pituba e orla, com perfis verificados.' },
  { slug: 'recife', nome: 'Recife', estado: 'PE', seo: 'Acompanhantes em Recife e região metropolitana: Boa Viagem, Pina e Casa Forte.' },
  { slug: 'fortaleza', nome: 'Fortaleza', estado: 'CE', seo: 'Acompanhantes em Fortaleza: Meireles, Aldeota e Praia de Iracema, com contato pelo WhatsApp.' },
  { slug: 'goiania', nome: 'Goiânia', estado: 'GO', seo: 'Acompanhantes em Goiânia: Setor Bueno, Setor Oeste e Jardim Goiás.' },
  { slug: 'florianopolis', nome: 'Florianópolis', estado: 'SC', seo: 'Acompanhantes em Florianópolis: Centro, Jurerê Internacional e Lagoa da Conceição.' },
  { slug: 'vitoria', nome: 'Vitória', estado: 'ES', seo: 'Acompanhantes em Vitória e Vila Velha: Praia do Canto, Jardim da Penha e Itaparica.' },
  { slug: 'manaus', nome: 'Manaus', estado: 'AM', seo: 'Acompanhantes em Manaus: Adrianópolis, Vieiralves e Ponta Negra.' },
  { slug: 'belem', nome: 'Belém', estado: 'PA', seo: 'Acompanhantes em Belém: Umarizal, Nazaré e Batista Campos.' },
  { slug: 'campo-grande', nome: 'Campo Grande', estado: 'MS', seo: 'Acompanhantes em Campo Grande com perfis verificados e atendimento discreto.' },
  { slug: 'cuiaba', nome: 'Cuiabá', estado: 'MT', seo: 'Acompanhantes em Cuiabá e Várzea Grande com fotos reais e contato direto.' },
  { slug: 'natal', nome: 'Natal', estado: 'RN', seo: 'Acompanhantes em Natal: Ponta Negra e Petrópolis, com discrição garantida.' },
  { slug: 'joao-pessoa', nome: 'João Pessoa', estado: 'PB', seo: 'Acompanhantes em João Pessoa: Manaíra, Tambaú e Cabo Branco.' },
  { slug: 'maceio', nome: 'Maceió', estado: 'AL', seo: 'Acompanhantes em Maceió: Ponta Verde, Jatiúca e Pajuçara.' },
  { slug: 'aracaju', nome: 'Aracaju', estado: 'SE', seo: 'Acompanhantes em Aracaju: Atalaia, Jardins e 13 de Julho.' },
  { slug: 'teresina', nome: 'Teresina', estado: 'PI', seo: 'Acompanhantes em Teresina com perfis verificados e contato pelo WhatsApp.' },
  { slug: 'sao-luis', nome: 'São Luís', estado: 'MA', seo: 'Acompanhantes em São Luís: Renascença, Ponta do Farol e Calhau.' },
  { slug: 'palmas', nome: 'Palmas', estado: 'TO', seo: 'Acompanhantes em Palmas com atendimento discreto e perfis verificados.' },
  { slug: 'macapa', nome: 'Macapá', estado: 'AP', seo: 'Acompanhantes em Macapá com fotos reais e contato direto.' },
  { slug: 'boa-vista', nome: 'Boa Vista', estado: 'RR', seo: 'Acompanhantes em Boa Vista com perfis verificados.' },
  { slug: 'porto-velho', nome: 'Porto Velho', estado: 'RO', seo: 'Acompanhantes em Porto Velho com atendimento discreto.' },
  { slug: 'rio-branco', nome: 'Rio Branco', estado: 'AC', seo: 'Acompanhantes em Rio Branco com perfis verificados.' },
]

export function cidadePorSlug(slug: string): CidadeInfo | undefined {
  return CIDADES.find((c) => c.slug === slug)
}
