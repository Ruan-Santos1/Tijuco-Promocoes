'use strict';

const $ = (seletor) => document.querySelector(seletor);

const CATEGORIAS = [
  'Mercado', 'Padaria', 'Moda', 'Eletrônicos',
  'Farmácia', 'Restaurante', 'Casa', 'Outros'
];

const K = {
  promos: 'tp_promos',
  lojas: 'tp_lojas',
  favs: 'tp_favs'
};

let imagemSelecionada = '';
let temporizadorAviso = null;

/* UTILITÁRIOS */

function load(chave, padrao) {
  try {
    const valor = localStorage.getItem(chave);
    return valor === null ? padrao : JSON.parse(valor);
  } catch (erro) {
    console.error(`Erro ao ler ${chave}:`, erro);
    return padrao;
  }
}

function save(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}

function esc(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[c]);
}

/* Ícone da cartela definida no início do index.html. */
function icone(nome) {
  return `<svg class="icone" aria-hidden="true"><use href="#i-${nome}"></use></svg>`;
}

function real(valor) {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function hojeISO() {
  const data = new Date();

  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

function diasRestantes(validade) {
  if (!validade) return 0;

  const [ano, mes, dia] = String(validade).split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  const hoje = new Date();

  hoje.setHours(0, 0, 0, 0);

  return Math.ceil((data - hoje) / 86400000);
}

function desconto(de, por) {
  return Number(de) > 0
    ? Math.round((1 - Number(por) / Number(de)) * 100)
    : 0;
}

function aviso(mensagem) {
  const el = $('#aviso');

  if (!el) {
    console.log(mensagem);
    return;
  }

  el.textContent = mensagem;
  el.hidden = false;

  clearTimeout(temporizadorAviso);

  temporizadorAviso = setTimeout(() => {
    el.hidden = true;
  }, 5000);
}

function numeroWhatsApp(numero) {
  return String(numero || '').replace(/\D/g, '');
}

function usuarioAtual() {
  return window.__tpUsuario || null;
}

function todasPromocoes() {
  return load(K.promos, []);
}

function ativas() {
  return todasPromocoes().filter((p) => p.validade >= hojeISO());
}

/* VERIFICAÇÃO DO SUPABASE */

function verificarSupabase() {
  if (typeof supabaseClient === 'undefined' || !supabaseClient) {
    console.error(
      'supabaseClient não foi encontrado. Confira os scripts no index.html.'
    );

    aviso('Não foi possível conectar ao banco de dados. Confira a configuração do Supabase.');

    return false;
  }

  return true;
}

/* IMAGENS */

function imagemValida(endereco) {
  if (typeof endereco !== 'string' || !endereco.trim()) {
    return '';
  }

  try {
    const url = new URL(endereco.trim());

    return ['https:', 'http:'].includes(url.protocol)
      ? url.href
      : '';
  } catch {
    return '';
  }
}

function fonteImagem(endereco) {
  if (typeof endereco !== 'string') return '';

  if (/^data:image\/(?:jpeg|png|webp|gif);base64,/i.test(endereco)) {
    return endereco;
  }

  return imagemValida(endereco);
}

function arquivoParaImagem(arquivo) {
  return new Promise((resolve, reject) => {
    if (!arquivo || !arquivo.type.startsWith('image/')) {
      reject(new Error('Selecione um arquivo de imagem válido.'));
      return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      reject(new Error('A imagem original deve ter no máximo 5 MB.'));
      return;
    }

    const leitor = new FileReader();

    leitor.onerror = () => {
      reject(new Error('Não foi possível ler a imagem.'));
    };

    leitor.onload = () => {
      const img = new Image();

      img.onerror = () => {
        reject(new Error('Não foi possível abrir essa imagem.'));
      };

      img.onload = () => {
        const limite = 900;

        const escala = Math.min(
          1,
          limite / Math.max(img.naturalWidth, img.naturalHeight)
        );

        const canvas = document.createElement('canvas');

        canvas.width = Math.max(
          1,
          Math.round(img.naturalWidth * escala)
        );

        canvas.height = Math.max(
          1,
          Math.round(img.naturalHeight * escala)
        );

        const contexto = canvas.getContext('2d');

        if (!contexto) {
          reject(new Error('Não foi possível processar a imagem.'));
          return;
        }

        contexto.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const resultado = canvas.toDataURL('image/jpeg', 0.7);

        if (resultado.length > 500000) {
          reject(
            new Error(
              'A imagem ficou muito grande após a compressão. Escolha outra foto.'
            )
          );

          return;
        }

        resolve(resultado);
      };

      img.src = leitor.result;
    };

    leitor.readAsDataURL(arquivo);
  });
}

function mostrarPreview(endereco) {
  const container = $('#preview-container');
  const preview = $('#preview-imagem');

  if (!container || !preview) return;

  if (!endereco) {
    preview.removeAttribute('src');
    container.hidden = true;
    return;
  }

  preview.onerror = () => {
    preview.removeAttribute('src');
    container.hidden = true;

    aviso('Não foi possível carregar a imagem. Confira o arquivo ou o link.');
  };

  preview.src = endereco;
  container.hidden = false;
}

function limparImagem() {
  imagemSelecionada = '';

  if ($('#arquivoImagem')) {
    $('#arquivoImagem').value = '';
  }

  if ($('#imagem')) {
    $('#imagem').value = '';
  }

  mostrarPreview('');
}

async function atualizarPreview(origem) {
  const arquivo = $('#arquivoImagem')?.files?.[0];
  const link = $('#imagem')?.value.trim() || '';

  if (origem === 'link') {
    $('#arquivoImagem').value = '';
    imagemSelecionada = '';

    if (!link) {
      mostrarPreview('');
      return;
    }

    const url = imagemValida(link);

    if (!url) {
      mostrarPreview('');
      aviso('Informe um link válido começando com http:// ou https://.');
      return;
    }

    mostrarPreview(url);
    return;
  }

  if (arquivo) {
    $('#imagem').value = '';

    try {
      imagemSelecionada = await arquivoParaImagem(arquivo);
      mostrarPreview(imagemSelecionada);
    } catch (erro) {
      imagemSelecionada = '';
      mostrarPreview('');
      $('#arquivoImagem').value = '';

      aviso(erro.message);
    }
  } else {
    imagemSelecionada = '';
    mostrarPreview('');
  }
}

/* CARREGAR DADOS DO SUPABASE */

async function carregarDados() {
  if (!verificarSupabase()) return;

  const lista = $('#lista');

  if (lista && !lista.children.length) {
    lista.innerHTML = esqueletoHTML();
  }

  try {
    const { data: promos, error: erroPromos } = await supabaseClient
      .from('promocoes')
      .select('*')
      .eq('ativa', true)
      .order('created_at', { ascending: false });

    if (erroPromos) throw erroPromos;

    const promocoesFormatadas = (promos || []).map((p) => ({
      id: p.id,
      loja: p.loja_id,
      titulo: p.titulo,
      descricao: p.descricao || '',
      imagem: p.imagem_url || '',
      de: Number(p.preco_original ?? p.preco ?? 0),
      por: Number(p.preco ?? 0),
      categoria: p.categoria || 'Outros',
      validade: p.validade || '',
      criada: p.created_at
        ? new Date(p.created_at).getTime()
        : 0
    }));

    save(K.promos, promocoesFormatadas);

    const { data: lojas, error: erroLojas } = await supabaseClient
      .from('lojas')
      .select('*');

    if (erroLojas) throw erroLojas;

    const lojasFormatadas = (lojas || []).map((loja) => ({
      id: loja.id,
      nome: loja.nome_loja,
      whatsapp: loja.telefone || '',
      cidade: loja.cidade || 'Ituiutaba',
      estado: loja.estado || 'MG',
      bairro: loja.bairro || '',
      endereco: loja.endereco || '',
      horario: loja.horario || '',
      instagram: loja.instagram || '',
      categoria: loja.categoria_loja || ''
    }));

    save(K.lojas, lojasFormatadas);

  } catch (erro) {
    console.error('Erro ao carregar dados do Supabase:', erro);

    aviso(
      'Não foi possível carregar as promoções. Confira o banco de dados e as permissões.'
    );
  }

  renderLista();
  renderFavs();
  await renderLoja();
}

/* CARTÕES */

function estadoVazio(titulo, descricao, nomeIcone = 'tag') {
  return `
    <div class="estado-vazio">
      ${icone(nomeIcone)}
      <h3>${esc(titulo)}</h3>
      <p>${esc(descricao)}</p>
    </div>
  `;
}

/* Cartões cinza exibidos enquanto as promoções são carregadas. */
function esqueletoHTML(quantidade = 3) {
  return Array.from({ length: quantidade }, () => `
    <div class="card-promocao esqueleto" aria-hidden="true">
      <div class="foto-card"></div>
      <div class="card-conteudo">
        <div class="linha curta"></div>
        <div class="linha"></div>
        <div class="linha alta"></div>
      </div>
    </div>
  `).join('');
}

function dataBR(validade) {
  return String(validade).split('-').reverse().join('/');
}

function textoValidade(validade) {
  const dias = diasRestantes(validade);

  if (dias < 0) {
    return { texto: `Encerrada em ${dataBR(validade)}`, urgente: false };
  }

  if (dias === 0) {
    return { texto: 'Último dia da promoção', urgente: true };
  }

  if (dias <= 3) {
    return { texto: `Termina em ${dias} dia${dias > 1 ? 's' : ''}`, urgente: true };
  }

  return { texto: `Válida até ${dataBR(validade)}`, urgente: false };
}

function linkWhatsApp(loja, promocao) {
  const telefone = loja ? numeroWhatsApp(loja.whatsapp) : '';

  if (!telefone) return '';

  return `https://wa.me/${telefoneBR(telefone)}?text=${encodeURIComponent(
    `Olá! Tenho interesse na promoção "${promocao.titulo}".`
  )}`;
}

function cardHTML(p, modo = 'publico') {
  const foto = fonteImagem(p.imagem);
  const percentual = desconto(p.de, p.por);

  const favoritos = load(K.favs, []).map(String);
  const favorita = favoritos.includes(String(p.id));

  const loja = lojaDe(p);
  const nomeLoja = loja ? loja.nome : 'Loja participante';
  const validade = textoValidade(p.validade);

  const botaoFavorito = modo === 'loja'
    ? ''
    : `
      <button
        type="button"
        class="botao-coracao"
        data-acao="favoritar"
        data-id="${esc(p.id)}"
        aria-pressed="${favorita}"
        aria-label="${favorita ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
        title="${favorita ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
      >
        ${icone('heart')}
      </button>
    `;

  let acoes = '';

  if (modo === 'loja') {
    acoes = `
      <button
        type="button"
        class="botao botao-perigo"
        data-acao="excluir"
        data-id="${esc(p.id)}"
      >
        ${icone('trash')}
        Excluir promoção
      </button>
    `;
  } else {
    const zap = linkWhatsApp(loja, p);

    acoes = `
      <button
        type="button"
        class="botao botao-principal"
        data-acao="detalhes"
        data-id="${esc(p.id)}"
      >
        Ver detalhes
      </button>

      ${
        zap
          ? `
            <a
              class="botao botao-whatsapp"
              href="${esc(zap)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${icone('chat')}
              WhatsApp
            </a>
          `
          : ''
      }

      <button
        type="button"
        class="botao botao-secundario botao-icone"
        data-acao="compartilhar"
        data-id="${esc(p.id)}"
        aria-label="Compartilhar"
        title="Compartilhar"
      >
        ${icone('share')}
      </button>
    `;
  }

  return `
    <article class="card-promocao">
      <div class="foto-card">
        <span class="selo-desconto">${percentual}% OFF</span>

        ${
          foto
            ? `<img src="${esc(foto)}" alt="${esc(p.titulo)}" loading="lazy">`
            : ''
        }

        <div class="sem-foto" ${foto ? 'hidden' : ''}>
          ${icone(foto ? 'image' : 'bag')}
          <span>${foto ? 'Foto indisponível' : 'Foto não informada'}</span>
        </div>

        ${botaoFavorito}
      </div>

      <div class="card-conteudo">
        <span class="card-categoria">${esc(p.categoria)}</span>

        <h3>${esc(p.titulo)}</h3>

        ${
          p.descricao
            ? `<p class="card-descricao">${esc(p.descricao)}</p>`
            : ''
        }

        <div class="precos">
          <span class="preco-atual">${real(p.por)}</span>
          <span class="preco-antigo">${real(p.de)}</span>
        </div>

        <ul class="card-meta">
          <li>${icone('store')}<span>${esc(nomeLoja)}</span></li>
          <li class="${validade.urgente ? 'urgente' : ''}">
            ${icone(validade.urgente ? 'clock' : 'calendar')}<span>${esc(validade.texto)}</span>
          </li>
        </ul>

        <div class="card-acoes">
          ${acoes}
        </div>
      </div>
    </article>
  `;
}

/* CATEGORIAS (botões de filtro) */

function montarChips() {
  const chips = $('#chipsCat');

  if (!chips) return;

  chips.innerHTML = ['', ...CATEGORIAS].map((categoria) => `
    <button
      type="button"
      class="chip"
      data-cat="${esc(categoria)}"
      aria-pressed="${categoria === ''}"
    >
      ${esc(categoria || 'Todas')}
    </button>
  `).join('');

  chips.addEventListener('click', (evento) => {
    const chip = evento.target.closest('.chip');

    if (!chip) return;

    $('#filtroCat').value = chip.dataset.cat;

    chips.querySelectorAll('.chip').forEach((item) => {
      item.setAttribute('aria-pressed', String(item === chip));
    });

    renderLista();
  });
}

/* LISTAGEM E PESQUISA */

function renderLista() {
  const lista = $('#lista');

  if (!lista) return;

  const busca = ($('#busca')?.value || '')
    .trim()
    .toLocaleLowerCase('pt-BR');

  const categoria = $('#filtroCat')?.value || '';
  const ordem = $('#ordem')?.value || '';

  let promos = ativas().filter((p) => {
    const texto = `${p.titulo} ${p.descricao || ''} ${p.categoria}`
      .toLocaleLowerCase('pt-BR');

    return texto.includes(busca) &&
      (!categoria || p.categoria === categoria);
  });

  if (ordem === 'desconto') {
    promos.sort(
      (a, b) => desconto(b.de, b.por) - desconto(a.de, a.por)
    );
  } else if (ordem === 'menor-preco') {
    promos.sort((a, b) => Number(a.por) - Number(b.por));
  } else if (ordem === 'validade') {
    promos.sort((a, b) => a.validade.localeCompare(b.validade));
  } else {
    promos.sort((a, b) => Number(b.criada) - Number(a.criada));
  }

  lista.innerHTML = promos.length
    ? promos.map((p) => cardHTML(p)).join('')
    : estadoVazio(
        'Nenhuma promoção encontrada',
        'Tente mudar a busca ou escolher outra categoria.',
        'search'
      );
}

function renderFavs() {
  const lista = $('#listaFavs');

  if (!lista) return;

  const favoritos = load(K.favs, []).map(String);

  const promos = ativas().filter(
    (p) => favoritos.includes(String(p.id))
  );

  lista.innerHTML = promos.length
    ? promos.map((p) => cardHTML(p, 'favoritos')).join('')
    : estadoVazio(
        'Você ainda não tem favoritos',
        'Quando encontrar uma oferta interessante, toque no coração para guardar.',
        'heart'
      );
}

function alternarFav(id) {
  const favoritos = load(K.favs, []).map(String);
  const chave = String(id);
  const existe = favoritos.includes(chave);

  try {
    save(
      K.favs,
      existe
        ? favoritos.filter((item) => item !== chave)
        : [...favoritos, chave]
    );
  } catch (erro) {
    console.error(erro);
    aviso('Não foi possível atualizar os favoritos neste navegador.');
    return;
  }

  renderLista();
  renderFavs();

  aviso(
    existe
      ? 'Promoção removida dos favoritos.'
      : 'Promoção adicionada aos favoritos!'
  );
}

/* NAVEGAÇÃO */

function mostrar(view) {
  document.querySelectorAll('.view').forEach((secao) => {
    secao.hidden = secao.id !== `view-${view}`;
  });

  document.querySelectorAll('[data-view]').forEach((botao) => {
    const ativo = botao.dataset.view === view;

    botao.classList.toggle('ativo', ativo);
    botao.setAttribute('aria-current', ativo ? 'page' : 'false');
  });

  if (view === 'promos') renderLista();
  if (view === 'favs') renderFavs();
  if (view === 'loja') renderLoja();

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

/* ÁREA DO LOJISTA */

async function renderLoja() {
  const auth = $('#auth');
  const painel = $('#painel');

  if (!auth || !painel) return;

  const usuario = usuarioAtual();

  if (!usuario) {
    auth.hidden = false;
    painel.hidden = true;
    return;
  }

  try {
    const { data: loja, error } = await supabaseClient
      .from('lojas')
      .select('*')
      .eq('id', usuario.id)
      .maybeSingle();

    if (error) throw error;

    let perfilLoja = loja;

    if (!perfilLoja) {
      const meta = usuario.user_metadata || {};
      const nome = String(meta.nome_loja || '').trim();

      if (!nome) {
        auth.hidden = false;
        painel.hidden = true;

        aviso(
          'Não encontramos o cadastro da loja. Entre novamente ou faça o cadastro.'
        );

        return;
      }

      perfilLoja = await salvarPerfil(usuario, meta);
    }

    auth.hidden = true;
    painel.hidden = false;

    $('#nomeLoja').textContent = perfilLoja.nome_loja;

    const minhas = todasPromocoes()
      .filter((p) => String(p.loja) === String(perfilLoja.id))
      .sort((a, b) => Number(b.criada) - Number(a.criada));

    $('#minhas').innerHTML = minhas.length
      ? minhas.map((p) => cardHTML(p, 'loja')).join('')
      : estadoVazio(
          'Você ainda não publicou ofertas',
          'Use o formulário acima para publicar sua primeira promoção.'
        );

  } catch (erro) {
    console.error('Erro ao carregar loja:', erro);

    auth.hidden = false;
    painel.hidden = true;

    aviso(
      'Não foi possível carregar os dados da loja. Confira as permissões do Supabase.'
    );
  }
}


/* CADASTRO DE LOJISTA */

async function cadastrar(evento) {
  evento.preventDefault();

  if (!verificarSupabase()) return;

  const formulario = evento.target;
  const dados = Object.fromEntries(new FormData(formulario));

  const email = String(dados.email || '').trim().toLowerCase();
  const senha = String(dados.senha || '');

  const meta = {
    // O app mobile usa "tipo" para saber se a conta é de lojista ou de cliente.
    tipo: 'lojista',
    nome_loja: String(dados.nome || '').trim(),
    responsavel: String(dados.responsavel || '').trim(),
    documento: soDigitos(dados.documento || dados.cnpj),
    telefone: soDigitos(dados.telefone),
    categoria_loja: String(dados.categoria_loja || ''),
    endereco: String(dados.endereco || '').trim(),
    bairro: String(dados.bairro || '').trim(),
    horario: String(dados.horario || '').trim(),
    instagram: limparInstagram(dados.instagram)
  };

  const erro =
    meta.nome_loja.length < 2 ? 'Informe o nome da loja.' :
    (meta.documento && !documentoValido(meta.documento)) ? 'CNPJ inválido. Confira os números.' :
    !/^\d{10,11}$/.test(meta.telefone) ? 'Informe o WhatsApp da loja com DDD.' :
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Informe um e-mail válido.' :
    senha.length < 6 ? 'A senha deve ter pelo menos 6 caracteres.' :
    (dados.confirmar && senha !== dados.confirmar) ? 'As senhas não conferem.' :
    '';

  if (erro) {
    aviso(erro);
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password: senha,
      options: {
        data: meta,
        emailRedirectTo: window.location.origin + window.location.pathname
      }
    });

    if (error) throw error;

    if (!data.user || data.user.identities?.length === 0) {
      aviso('Esse e-mail já está cadastrado. Use "Entrar" ou recupere a senha.');
      return;
    }

    if (!data.session) {
      formulario.reset();

      aviso('Cadastro iniciado! Confirme seu e-mail e depois entre na sua conta.');

      return;
    }

    window.__tpUsuario = data.user;

    await salvarPerfil(data.user, meta);

    formulario.reset();

    await carregarDados();
    mostrar('loja');

    aviso('Loja cadastrada com sucesso!');

  } catch (erro) {
    console.error('Erro no cadastro:', erro);

    aviso(
      erro.message ||
      'Não foi possível cadastrar a loja. Confira os dados e tente novamente.'
    );
  }
}

/* LOGIN */

async function entrar(evento) {
  evento.preventDefault();

  if (!verificarSupabase()) return;

  const formulario = evento.target;
  const dados = Object.fromEntries(new FormData(formulario));

  const email = String(dados.email || '').trim().toLowerCase();
  const senha = String(dados.senha || '');

  if (!email || !senha) {
    aviso('Informe seu e-mail e sua senha.');
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth
      .signInWithPassword({
        email,
        password: senha
      });

    if (error) throw error;

    window.__tpUsuario = data.user;

    formulario.reset();

    await carregarDados();
    mostrar('loja');

    aviso('Login realizado com sucesso!');

  } catch (erro) {
    console.error('Erro no login:', erro);

    aviso(
      'Não foi possível entrar. Confira o e-mail, a senha e se o e-mail foi confirmado.'
    );
  }
}

/* PUBLICAR PROMOÇÃO */

async function publicar(evento) {
  evento.preventDefault();

  if (!verificarSupabase()) return;

  const usuario = usuarioAtual();

  if (!usuario) {
    aviso('Entre na sua conta de lojista antes de publicar.');
    await renderLoja();
    return;
  }

  const formulario = evento.target;
  const dados = Object.fromEntries(new FormData(formulario));

  const titulo = String(dados.titulo || '').trim();
  const descricao = String(dados.descricao || '').trim();
  const de = Number(dados.de);
  const por = Number(dados.por);
  const categoria = String(dados.categoria || '');
  const validade = String(dados.validade || '');
  const link = String(dados.imagem || '').trim();
  const arquivo = $('#arquivoImagem')?.files?.[0];

  if (!titulo) {
    aviso('Informe o nome do produto ou da promoção.');
    return;
  }

  if (
    !Number.isFinite(de) ||
    !Number.isFinite(por) ||
    de <= 0 ||
    por <= 0
  ) {
    aviso('Informe preços válidos.');
    return;
  }

  if (por >= de) {
    aviso('O preço promocional deve ser menor que o preço original.');
    return;
  }

  if (!CATEGORIAS.includes(categoria)) {
    aviso('Selecione uma categoria válida.');
    return;
  }

  if (!validade || validade < hojeISO()) {
    aviso('Informe uma validade igual ou posterior a hoje.');
    return;
  }

  if (link && !imagemValida(link)) {
    aviso('Informe um link de imagem válido.');
    return;
  }

  let imagem = link ? imagemValida(link) : '';

  try {
    if (arquivo) {
      imagem = await arquivoParaImagem(arquivo);
    } else if (imagemSelecionada) {
      imagem = imagemSelecionada;
    }
  } catch (erro) {
    aviso(erro.message);
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('promocoes')
      .insert({
        loja_id: usuario.id,
        titulo,
        descricao,
        preco_original: de,
        preco: por,
        imagem_url: imagem || null,
        categoria,
        validade,
        ativa: true
      });

    if (error) throw error;

    formulario.reset();
    limparImagem();

    await carregarDados();

    aviso('Promoção publicada com sucesso!');

  } catch (erro) {
    console.error('Erro ao publicar promoção:', erro);

    aviso(
      'Não foi possível publicar. Confira as colunas da tabela promocoes e as permissões do banco.'
    );
  }
}

/* EXCLUIR PROMOÇÃO */

async function excluir(id) {
  if (!verificarSupabase()) return;

  const usuario = usuarioAtual();

  if (!usuario) {
    aviso('Entre na sua conta para excluir uma promoção.');
    return;
  }

  const promocao = todasPromocoes().find(
    (p) => String(p.id) === String(id)
  );

  if (
    !promocao ||
    String(promocao.loja) !== String(usuario.id)
  ) {
    aviso('Você não pode excluir essa promoção.');
    return;
  }

  const confirmar = window.confirm(
    `Deseja realmente excluir a promoção "${promocao.titulo}"?`
  );

  if (!confirmar) return;

  try {
    const { error } = await supabaseClient
      .from('promocoes')
      .delete()
      .eq('id', id)
      .eq('loja_id', usuario.id);

    if (error) throw error;

    await carregarDados();

    aviso('Promoção excluída.');

  } catch (erro) {
    console.error('Erro ao excluir promoção:', erro);

    aviso('Não foi possível excluir a promoção.');
  }
}

/* SAIR DA CONTA */

async function sair() {
  if (!verificarSupabase()) return;

  try {
    const { error } = await supabaseClient.auth.signOut();

    if (error) throw error;

    window.__tpUsuario = null;

    await renderLoja();

    aviso('Você saiu da sua conta.');

  } catch (erro) {
    console.error('Erro ao sair:', erro);

    aviso('Não foi possível encerrar a sessão.');
  }
}

/* EVENTOS DA PÁGINA */

function eventos() {
  document.querySelectorAll('[data-view]').forEach((botao) => {
    botao.addEventListener('click', () => {
      mostrar(botao.dataset.view);
    });
  });

  $('#voltar-inicio')?.addEventListener('click', (evento) => {
    evento.preventDefault();
    mostrar('promos');
  });

  $('#busca')?.addEventListener('input', renderLista);
  $('#filtroCat')?.addEventListener('change', renderLista);
  $('#ordem')?.addEventListener('change', renderLista);

  $('#formCadastro')?.addEventListener('submit', cadastrar);
  $('#formLogin')?.addEventListener('submit', entrar);
  $('#formPromo')?.addEventListener('submit', publicar);

  $('#sair')?.addEventListener('click', sair);

  $('#arquivoImagem')?.addEventListener('change', () => {
    atualizarPreview('arquivo');
  });

  $('#imagem')?.addEventListener('input', () => {
    atualizarPreview('link');
  });

  $('#remover-imagem')?.addEventListener('click', limparImagem);

  document.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-acao]');

    if (!botao) return;

    if (botao.dataset.acao === 'favoritar') {
      alternarFav(botao.dataset.id);
    }

    if (botao.dataset.acao === 'excluir') {
      excluir(botao.dataset.id);
    }

    if (botao.dataset.acao === 'detalhes') detalhes(botao.dataset.id);
    if (botao.dataset.acao === 'compartilhar') compartilhar(botao.dataset.id);
    if (botao.dataset.acao === 'copiar') copiarLink();
    if (botao.dataset.acao === 'fechar-modal') fecharModal();
  });

  $('#modal')?.addEventListener('click', (evento) => {
    if (evento.target.id === 'modal') fecharModal();
  });

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && $('#modal') && !$('#modal').hidden) fecharModal();
  });

  $('#esqueci')?.addEventListener('click', recuperarSenha);

  $('#formCadastro [name="telefone"]')?.addEventListener('input', (e) => {
    e.target.value = mascaraTelefone(e.target.value);
  });

  $('#formCadastro [name="documento"]')?.addEventListener('input', (e) => {
    e.target.value = mascaraDocumento(e.target.value);
  });

  document.addEventListener('error', (evento) => {
    const img = evento.target;

    if (
      !(img instanceof HTMLImageElement) ||
      !img.closest('.foto-card')
    ) {
      return;
    }

    img.hidden = true;

    const reserva = img.nextElementSibling;

    if (reserva?.classList.contains('sem-foto')) {
      reserva.hidden = false;
    }
  }, true);
}

/* VALIDAÇÕES E MÁSCARAS */

function soDigitos(valor) {
  return String(valor || '').replace(/\D/g, '');
}

function telefoneBR(valor) {
  const d = soDigitos(valor);
  return d.startsWith('55') && d.length >= 12 ? d : `55${d}`;
}

function mascaraTelefone(valor) {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function mascaraDocumento(valor) {
  const d = soDigitos(valor).slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function documentoValido(valor) {
  const d = soDigitos(valor);
  if (/^(\d)\1+$/.test(d)) return false;

  const digito = (base, pesos) => {
    const soma = base.split('').reduce((t, n, i) => t + Number(n) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  if (d.length === 11) {
    return digito(d.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[9]) &&
      digito(d.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[10]);
  }

  if (d.length === 14) {
    const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    return digito(d.slice(0, 12), p1) === Number(d[12]) &&
      digito(d.slice(0, 13), [6, ...p1]) === Number(d[13]);
  }

  return false;
}

function limparInstagram(valor) {
  return String(valor || '')
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/[/?].*$/, '')
    .replace(/[^A-Za-z0-9._]/g, '');
}

/* PERFIL DA LOJA (dados públicos + dados privados) */

function dadosPerfil(meta) {
  return {
    nome_loja: String(meta.nome_loja || '').trim(),
    telefone: soDigitos(meta.telefone),
    categoria_loja: meta.categoria_loja || null,
    bairro: String(meta.bairro || '').trim() || null,
    endereco: String(meta.endereco || '').trim() || null,
    horario: String(meta.horario || '').trim() || null,
    instagram: limparInstagram(meta.instagram) || null,
    cidade: 'Ituiutaba',
    estado: 'MG'
  };
}

async function salvarPerfil(usuario, meta) {
  const { data, error } = await supabaseClient
    .from('lojas')
    .upsert({ id: usuario.id, ...dadosPerfil(meta) })
    .select('*')
    .single();

  if (error) throw error;

  if (meta.documento || meta.responsavel) {
    const { error: erroPrivado } = await supabaseClient
      .from('lojas_privado')
      .upsert({
        id: usuario.id,
        documento: soDigitos(meta.documento),
        responsavel: String(meta.responsavel || '').trim()
      });

    if (erroPrivado) throw erroPrivado;
  }

  return data;
}

/* MODAL */

function abrirModal(html) {
  $('#modal-corpo').innerHTML = html;
  $('#modal').hidden = false;
  document.body.style.overflow = 'hidden';
  $('#modal .modal-fechar').focus();
}

function fecharModal() {
  $('#modal').hidden = true;
  $('#modal-corpo').innerHTML = '';
  document.body.style.overflow = '';
}

/* DETALHES E COMPARTILHAMENTO */

function buscarPromocao(id) {
  return todasPromocoes().find((p) => String(p.id) === String(id));
}

function lojaDe(promocao) {
  return load(K.lojas, []).find((l) => String(l.id) === String(promocao.loja));
}

function linkPromocao(id) {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('promo', id);
  return url.href;
}

function textoCompartilhar(p) {
  const loja = lojaDe(p);

  return `🔥 ${p.titulo} por ${real(p.por)} (${desconto(p.de, p.por)}% OFF)` +
    `${loja ? ` na ${loja.nome}` : ''}. Veja no Tijuco Promoções:`;
}

function detalhes(id) {
  const p = buscarPromocao(id);

  if (!p) {
    aviso('Promoção não encontrada ou já encerrada.');
    return;
  }

  const l = lojaDe(p) || {};
  const foto = fonteImagem(p.imagem);
  const zap = linkWhatsApp(l, p);
  const validade = textoValidade(p.validade);

  const mapa = l.endereco
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${l.endereco}, ${l.bairro || ''}, Ituiutaba - MG`
      )}`
    : '';

  abrirModal(`
    ${foto ? `<img class="modal-foto" src="${esc(foto)}" alt="${esc(p.titulo)}">` : ''}
    <span class="card-categoria">${esc(p.categoria)}</span>
    <h2 id="modal-titulo">${esc(p.titulo)}</h2>
    ${p.descricao ? `<p class="card-descricao">${esc(p.descricao)}</p>` : ''}
    <div class="precos">
      <span class="preco-atual">${real(p.por)}</span>
      <span class="preco-antigo">${real(p.de)}</span>
      <span class="selo-desconto selo-inline">${desconto(p.de, p.por)}% OFF</span>
    </div>
    <ul class="card-meta">
      <li class="${validade.urgente ? 'urgente' : ''}">
        ${icone(validade.urgente ? 'clock' : 'calendar')}<span>${esc(validade.texto)}</span>
      </li>
    </ul>

    <div class="loja-info">
      <h3>${icone('store')}${esc(l.nome || 'Loja participante')}</h3>
      ${l.endereco ? `<p>${icone('pin')}<span>${esc(l.endereco)}${l.bairro ? ` – ${esc(l.bairro)}` : ''}
        · <a href="${esc(mapa)}" target="_blank" rel="noopener noreferrer">Ver no mapa</a></span></p>` : ''}
      ${l.horario ? `<p>${icone('clock')}<span>${esc(l.horario)}</span></p>` : ''}
      ${l.instagram ? `<p>${icone('instagram')}<a href="https://instagram.com/${esc(l.instagram)}" target="_blank" rel="noopener noreferrer">@${esc(l.instagram)}</a></p>` : ''}
    </div>

    <div class="card-acoes">
      ${zap ? `<a class="botao botao-whatsapp" href="${esc(zap)}" target="_blank" rel="noopener noreferrer">${icone('chat')}Chamar no WhatsApp</a>` : ''}
      <button type="button" class="botao botao-secundario" data-acao="compartilhar" data-id="${esc(p.id)}">${icone('share')}Compartilhar</button>
    </div>
  `);
}

async function compartilhar(id) {
  const p = buscarPromocao(id);
  if (!p) return;

  const url = linkPromocao(p.id);
  const texto = textoCompartilhar(p);

  if (navigator.share) {
    try {
      await navigator.share({ title: p.titulo, text: texto, url });
      return;
    } catch (erro) {
      if (erro.name === 'AbortError') return;
    }
  }

  const t = encodeURIComponent(texto);
  const u = encodeURIComponent(url);

  abrirModal(`
    <h2 id="modal-titulo">Compartilhar promoção</h2>
    <p class="texto-secundario">${esc(p.titulo)}</p>
    <div class="share-grade">
      <a class="botao botao-whatsapp" target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=${t}%20${u}">${icone('chat')}WhatsApp</a>
      <a class="botao botao-secundario" target="_blank" rel="noopener noreferrer" href="https://www.facebook.com/sharer/sharer.php?u=${u}">Facebook</a>
      <a class="botao botao-secundario" target="_blank" rel="noopener noreferrer" href="https://t.me/share/url?url=${u}&text=${t}">Telegram</a>
      <a class="botao botao-secundario" href="mailto:?subject=${encodeURIComponent(p.titulo)}&body=${t}%20${u}">E-mail</a>
    </div>
    <label>Link da promoção
      <input id="link-copia" readonly value="${esc(url)}">
    </label>
    <button type="button" class="botao botao-principal" data-acao="copiar" style="margin-top: 12px; width: 100%;">Copiar link</button>
  `);
}

async function copiarLink() {
  const campo = $('#link-copia');
  if (!campo) return;

  try {
    await navigator.clipboard.writeText(campo.value);
  } catch {
    campo.select();
    document.execCommand('copy');
  }

  aviso('Link copiado!');
}

/* RECUPERAÇÃO DE SENHA */

async function recuperarSenha() {
  if (!verificarSupabase()) return;

  const email = String($('#formLogin [name="email"]')?.value || '').trim().toLowerCase();

  if (!email) {
    aviso('Digite seu e-mail no campo acima para receber o link.');
    return;
  }

  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });

    if (error) throw error;

    aviso('Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha.');
  } catch (erro) {
    console.error('Erro ao recuperar senha:', erro);
    aviso('Não foi possível enviar o e-mail de recuperação.');
  }
}

function pedirNovaSenha() {
  abrirModal(`
    <h2 id="modal-titulo">Criar nova senha</h2>
    <form id="formNovaSenha" class="formulario">
      <label>Nova senha
        <input name="senha" type="password" minlength="6" autocomplete="new-password" required>
      </label>
      <button type="submit" class="botao botao-principal">Salvar nova senha</button>
    </form>
  `);

  $('#formNovaSenha').addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const senha = String(new FormData(evento.target).get('senha') || '');
    const { error } = await supabaseClient.auth.updateUser({ password: senha });

    if (error) {
      aviso(error.message || 'Não foi possível alterar a senha.');
      return;
    }

    fecharModal();
    aviso('Senha alterada com sucesso!');
  });
}

/* INICIALIZAÇÃO */

async function iniciar() {
  eventos();
  montarChips();

  const campoValidade = $('#formPromo [name="validade"]');

  if (campoValidade) {
    campoValidade.min = hojeISO();
  }

  if (!verificarSupabase()) return;

  try {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) throw error;

    window.__tpUsuario = data?.session?.user || null;

    supabaseClient.auth.onAuthStateChange((evento, session) => {
      window.__tpUsuario = session?.user || null;

      // Evita executar consultas diretamente dentro do callback de autenticação.
      setTimeout(() => {
        if (evento === 'PASSWORD_RECOVERY') pedirNovaSenha();
        else if (evento === 'SIGNED_OUT') carregarDados();
      }, 0);
    });

    await carregarDados();

    mostrar('promos');

    const idLink = new URLSearchParams(window.location.search).get('promo');

    if (idLink) detalhes(idLink);

  } catch (erro) {
    console.error('Erro ao iniciar a aplicação:', erro);

    aviso('Não foi possível iniciar. Confira a configuração do Supabase.');
  }
}

iniciar();