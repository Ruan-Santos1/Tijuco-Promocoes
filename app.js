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
      .select('id,nome_loja,telefone,cidade,estado');

    if (erroLojas) throw erroLojas;

    const lojasFormatadas = (lojas || []).map((loja) => ({
      id: loja.id,
      nome: loja.nome_loja,
      whatsapp: loja.telefone || '',
      cidade: loja.cidade || 'Ituiutaba',
      estado: loja.estado || 'MG'
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

function estadoVazio(titulo, descricao) {
  return `
    <div class="estado-vazio">
      <h3>${esc(titulo)}</h3>
      <p>${esc(descricao)}</p>
    </div>
  `;
}

function cardHTML(p, modo = 'publico') {
  const foto = fonteImagem(p.imagem);
  const percentual = desconto(p.de, p.por);

  const favoritos = load(K.favs, []).map(String);
  const favorita = favoritos.includes(String(p.id));

  const lojas = load(K.lojas, []);

  const loja = lojas.find(
    (item) => String(item.id) === String(p.loja)
  );

  const nomeLoja = loja ? loja.nome : 'Loja participante';
  const dias = diasRestantes(p.validade);

  const imagemHTML = foto
    ? `
      <div class="foto-card">
        <span class="selo-desconto">${percentual}% OFF</span>
        <img
          src="${esc(foto)}"
          alt="${esc(p.titulo)}"
          loading="lazy"
        >
        <div class="sem-foto" hidden>
          <span class="sem-foto-icone">📷</span>
          <span>Foto indisponível</span>
        </div>
      </div>
    `
    : `
      <div class="foto-card">
        <span class="selo-desconto">${percentual}% OFF</span>
        <div class="sem-foto">
          <span class="sem-foto-icone">🛍️</span>
          <span>Foto não informada</span>
        </div>
      </div>
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
        Excluir promoção
      </button>
    `;
  } else {
    const telefone = loja
      ? numeroWhatsApp(loja.whatsapp)
      : '';

    const linkWhatsApp = telefone
      ? `https://wa.me/55${telefone}?text=${encodeURIComponent(
          `Olá! Tenho interesse na promoção "${p.titulo}".`
        )}`
      : '';

    acoes = `
      <button
        type="button"
        class="botao botao-favorito"
        data-acao="favoritar"
        data-id="${esc(p.id)}"
        aria-pressed="${favorita}"
      >
        ${favorita ? '♥ Salvo' : '♡ Favoritar'}
      </button>

      ${
        linkWhatsApp
          ? `
            <a
              class="botao botao-whatsapp"
              href="${esc(linkWhatsApp)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          `
          : ''
      }
    `;
  }

  return `
    <article class="card-promocao">
      ${imagemHTML}

      <div class="card-conteudo">
        <span class="card-categoria">${esc(p.categoria)}</span>

        <h3>${esc(p.titulo)}</h3>

        ${
          p.descricao
            ? `<p class="card-descricao">${esc(p.descricao)}</p>`
            : ''
        }

        <div class="precos">
          <span class="preco-antigo">${real(p.de)}</span>
          <span class="preco-atual">${real(p.por)}</span>
        </div>

        <p class="card-loja">🏪 ${esc(nomeLoja)}</p>

        <p class="card-validade">
          ${
            dias === 0
              ? 'Último dia da promoção'
              : `Válida até ${esc(
                  String(p.validade).split('-').reverse().join('/')
                )}`
          }
        </p>

        <div class="card-acoes">
          ${acoes}
        </div>
      </div>
    </article>
  `;
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
        'Tente mudar a busca ou escolher outra categoria.'
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
        'Quando encontrar uma oferta interessante, clique em Favoritar.'
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

      const { data: criada, error: erroCriacao } =
        await supabaseClient
          .from('lojas')
          .upsert({
            id: usuario.id,
            nome_loja: nome,
            telefone: String(meta.telefone || ''),
            cidade: 'Ituiutaba',
            estado: 'MG'
          })
          .select('*')
          .single();

      if (erroCriacao) throw erroCriacao;

      perfilLoja = criada;
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

  const nome = String(dados.nome || '').trim();
  const email = String(dados.email || '').trim().toLowerCase();
  const senha = String(dados.senha || '');

  if (nome.length < 2) {
    aviso('Informe o nome da loja.');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    aviso('Informe um e-mail válido.');
    return;
  }

  if (senha.length < 6) {
    aviso('A senha deve ter pelo menos 6 caracteres.');
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome_loja: nome
        }
      }
    });

    if (error) throw error;

    if (!data.user) {
      aviso('O cadastro não foi concluído. Tente novamente.');
      return;
    }

    if (!data.session) {
      formulario.reset();

      aviso(
        'Cadastro iniciado! Confirme seu e-mail e depois entre na sua conta.'
      );

      return;
    }

    window.__tpUsuario = data.user;

    const { error: erroLoja } = await supabaseClient
      .from('lojas')
      .upsert({
        id: data.user.id,
        nome_loja: nome,
        telefone: null,
        cidade: 'Ituiutaba',
        estado: 'MG'
      });

    if (erroLoja) throw erroLoja;

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

/* INICIALIZAÇÃO */

async function iniciar() {
  eventos();

  const campoValidade = $('#formPromo [name="validade"]');

  if (campoValidade) {
    campoValidade.min = hojeISO();
  }

  if (!verificarSupabase()) return;

  try {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) throw error;

    window.__tpUsuario = data?.session?.user || null;

    supabaseClient.auth.onAuthStateChange((_evento, session) => {
      window.__tpUsuario = session?.user || null;

      // Evita executar consultas diretamente dentro do callback de autenticação.
      setTimeout(() => {
        carregarDados();
      }, 0);
    });

    await carregarDados();

    mostrar('promos');

  } catch (erro) {
    console.error('Erro ao iniciar a aplicação:', erro);

    aviso('Não foi possível iniciar. Confira a configuração do Supabase.');
  }
}

iniciar();