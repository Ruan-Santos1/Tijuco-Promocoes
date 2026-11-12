// Edite estes dois campos antes de publicar o app.
export const CONTROLADOR = 'Tijuco Promoções';
export const CONTATO = '[informe aqui o e-mail de contato]';
// Depois de publicar as páginas (pasta docs/), cole aqui os endereços públicos.
export const POLITICA_URL = '';
export const TERMOS_URL = '';
export const ATUALIZADA_EM = '08/11/2026';

export const POLITICA: { titulo: string; texto: string }[] = [
  {
    titulo: '1. Quem somos',
    texto: `O aplicativo ${CONTROLADOR} reúne promoções do comércio de Ituiutaba-MG. Esta política explica, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018 – LGPD), como tratamos os dados pessoais de clientes e lojistas. Contato do responsável: ${CONTATO}.`,
  },
  {
    titulo: '2. Dados que coletamos',
    texto: 'Clientes: nome, e-mail e lista de promoções favoritas.\nLojistas: nome da loja, nome do responsável, CPF ou CNPJ, telefone/WhatsApp, endereço, bairro, horário de funcionamento, Instagram, e-mail, promoções e fotos publicadas.\nDados técnicos: informações de sessão guardadas no seu aparelho para manter você conectado.\nNão coletamos sua localização e só acessamos fotos que você escolher ou tirar ao publicar uma oferta.',
  },
  {
    titulo: '3. Para que usamos e base legal',
    texto: 'Usamos os dados para criar e manter sua conta, exibir ofertas, permitir favoritos e contato entre cliente e loja, e proteger a segurança da plataforma. As bases legais são a execução do serviço que você solicitou, o seu consentimento (aceite no cadastro) e o legítimo interesse para prevenção a fraudes (art. 7º da LGPD).',
  },
  {
    titulo: '4. O que fica público',
    texto: 'Ficam visíveis a qualquer pessoa: nome da loja, telefone/WhatsApp, endereço, bairro, horário, Instagram, promoções e fotos. CPF/CNPJ, nome do responsável e e-mail não são exibidos ao público. Dados de clientes, incluindo favoritos, não são exibidos a lojas.',
  },
  {
    titulo: '5. Com quem compartilhamos',
    texto: 'Não vendemos dados pessoais. Usamos o Supabase como operador para autenticação, banco de dados e armazenamento de imagens. Ao tocar em WhatsApp, mapa, Instagram ou compartilhar, você abre serviços de terceiros, que têm políticas próprias. Podemos compartilhar dados quando a lei ou ordem judicial exigir.',
  },
  {
    titulo: '6. Transferência internacional',
    texto: 'Os servidores do nosso provedor podem estar fora do Brasil. Nesses casos, buscamos provedores que adotem medidas de segurança compatíveis com a LGPD (art. 33).',
  },
  {
    titulo: '7. Por quanto tempo guardamos',
    texto: 'Mantemos os dados enquanto sua conta existir. Ao excluir a conta no aplicativo, apagamos seu cadastro, favoritos, loja e promoções, salvo o que precisarmos guardar por obrigação legal.',
  },
  {
    titulo: '8. Segurança',
    texto: 'Usamos conexão criptografada, senhas protegidas pelo serviço de autenticação e regras de acesso por usuário no banco de dados. Nenhum sistema é 100% seguro, por isso recomendamos senhas fortes e únicas.',
  },
  {
    titulo: '9. Seus direitos',
    texto: `Você pode confirmar se tratamos seus dados, acessar, corrigir, pedir anonimização ou eliminação, solicitar portabilidade, saber com quem compartilhamos e revogar o consentimento (art. 18 da LGPD). Dentro do app você edita seus dados e exclui a conta em Perfil. Para outros pedidos, escreva para ${CONTATO}.`,
  },
  {
    titulo: '10. Crianças e adolescentes',
    texto: 'O aplicativo é destinado a maiores de 18 anos. Menores só podem usá-lo com o consentimento de um responsável legal.',
  },
  {
    titulo: '11. Alterações',
    texto: `Podemos atualizar esta política. Em caso de mudança relevante, avisaremos no aplicativo. Última atualização: ${ATUALIZADA_EM}.`,
  },
];
