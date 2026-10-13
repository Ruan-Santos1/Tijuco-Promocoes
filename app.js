'use strict';

const $ = (seletor) => document.querySelector(seletor);

const CATEGORIAS = ['Mercado', 'Padaria', 'Moda', 'Eletrônicos', 'Farmácia', 'Restaurante', 'Casa', 'Outros'];
const K = { promos: 'tp_promos', lojas: 'tp_lojas', favs: 'tp_favs', sessao: 'tp_sessao' };

let imagemSelecionada = '';
let temporizadorAviso = null;

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
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

function real(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function diasRestantes(validade) {
  const [ano, mes, dia] = String(validade).split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.ceil((data - hoje) / 86400000);
}

function desconto(de, por) {
  return Number(de) > 0 ? Math.round((1 - Number(por) / Number(de)) * 100) : 0;
}

function aviso(mensagem) {
  const el = $('#aviso');
  el.textContent = mensagem;
  el.hidden = false;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => { el.hidden = true; }, 4000);
}

function numeroWhatsApp(numero) {
  return String(numero || '').replace(/\D/g, '');
}

function criarId() {
  return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/* FOTOS: link ou arquivo local comprimido */
function imagemValida(endereco) {
  if (typeof endereco !== 'string' || !endereco.trim()) return '';
  try {
    const url = new URL(endereco.trim());
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function fonteImagem(endereco) {
  if (typeof endereco !== 'string') return '';
  if (/^data:image\/(?:jpeg|png|webp|gif);base64,/i.test(endereco)) return endereco;
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
    leitor.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Não foi possível abrir essa imagem.'));
      img.onload = () => {
        const limite = 900;
        const escala = Math.min(1, limite / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.naturalWidth * escala));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * escala));
        const contexto = canvas.getContext('2d');
        if (!contexto) {
          reject(new Error('Não foi possível processar a imagem.'));
          return;
        }
        contexto.drawImage(img, 0, 0, canvas.width, canvas.height);
        const resultado = canvas.toDataURL('image/jpeg', 0.7);
        if (resultado.length > 500000) {
          reject(new Error('A imagem ficou muito grande após a compressão. Escolha outra foto.'));
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
  $('#arquivoImagem').value = '';
  $('#imagem').value = '';
  mostrarPreview('');
}

async function atualizarPreview(origem) {
  const arquivo = $('#arquivoImagem').files[0];
  const link = $('#imagem').value.trim();

  if (origem === 'link') {
    $('#arquivoImagem').value = '';
    imagemSelecionada = '';
    if (!link) return mostrarPreview('');
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

/* CARTÕES E LISTAS */
function todasPromocoes() {
  return load(K.promos, []);
}

function ativas() {
  return todasPromocoes().filter((p) => p.validade >= hojeISO());
}

function estadoVazio(titulo, descricao) {
  return `<div class="estado-vazio"><h3>${esc(titulo)}</h3><p>${esc(descricao)}</p></div>`;
}

function cardHTML(p, modo = 'publico') {
  const foto = fonteImagem(p.imagem);
  const percentual = desconto(p.de, p.por);
  const favoritos = load(K.favs, []).map(String);
  const favorita = favoritos.includes(String(p.id));
  const lojas = load(K.lojas, []);
  const loja = lojas.find((item) => String(item.id) === String(p.loja));
  const nomeLoja = loja ? loja.nome : 'Loja participante';
  const dias = diasRestantes(p.validade);

  const imagemHTML = foto
    ? `<div class="foto-card"><span class="selo-desconto">${percentual}% OFF</span><img src="${esc(foto)}" alt="${esc(p.titulo)}" loading="lazy"><div class="sem-foto" hidden><span class="sem-foto-icone">📷</span><span>Foto indisponível</span></div></div>`
    : `<div class="foto-card"><span class="selo-desconto">${percentual}% OFF</span><div class="sem-foto"><span class="sem-foto-icone">🛍️</span><span>Foto não informada</span></div></div>`;

  let acoes;
  if (modo === 'loja') {
    acoes = `<button type="button" class="botao botao-perigo" data-acao="excluir" data-id="${esc(p.id)}">Excluir promoção</button>`;
  } else {
    const telefone = loja ? numeroWhatsApp(loja.whatsapp) : '';
    const linkWhatsApp = telefone
      ? `https://wa.me/55${telefone}?text=${encodeURIComponent(`Olá! Tenho interesse na promoção "${p.titulo}".`)}`
      : '';
    acoes = `<button type="button" class="botao botao-favorito" data-acao="favoritar" data-id="${esc(p.id)}" aria-pressed="${favorita}">${favorita ? '♥ Salvo' : '♡ Favoritar'}</button>
      ${linkWhatsApp ? `<a class="botao botao-whatsapp" href="${esc(linkWhatsApp)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : ''}`;
  }

  return `<article class="card-promocao">${imagemHTML}<div class="card-conteudo">
    <span class="card-categoria">${esc(p.categoria)}</span><h3>${esc(p.titulo)}</h3>
    ${p.descricao ? `<p class="card-descricao">${esc(p.descricao)}</p>` : ''}
    <div class="precos"><span class="preco-antigo">${real(p.de)}</span><span class="preco-atual">${real(p.por)}</span></div>
    <p class="card-loja">🏪 ${esc(nomeLoja)}</p>
    <p class="card-validade">${dias === 0 ? 'Último dia da promoção' : `Válida até ${esc(String(p.validade).split('-').reverse().join('/'))}`}</p>
    <div class="card-acoes">${acoes}</div>
  </div></article>`;
}

function renderLista() {
  const busca = $('#busca').value.trim().toLocaleLowerCase('pt-BR');
  const categoria = $('#filtroCat').value;
  const ordem = $('#ordem').value;

  let promos = ativas().filter((p) => {
    const texto = `${p.titulo} ${p.descricao || ''} ${p.categoria}`.toLocaleLowerCase('pt-BR');
    return texto.includes(busca) && (!categoria || p.categoria === categoria);
  });

  if (ordem === 'desconto') promos.sort((a, b) => desconto(b.de, b.por) - desconto(a.de, a.por));
  else if (ordem === 'menor-preco') promos.sort((a, b) => Number(a.por) - Number(b.por));
  else if (ordem === 'validade') promos.sort((a, b) => a.validade.localeCompare(b.validade));
  else promos.sort((a, b) => Number(b.criada) - Number(a.criada));

  $('#lista').innerHTML = promos.length ? promos.map((p) => cardHTML(p)).join('') :
    estadoVazio('Nenhuma promoção encontrada', 'Tente mudar a busca ou escolher outra categoria.');
}

function renderFavs() {
  const favoritos = load(K.favs, []).map(String);
  const promos = ativas().filter((p) => favoritos.includes(String(p.id)));
  $('#listaFavs').innerHTML = promos.length ? promos.map((p) => cardHTML(p, 'favoritos')).join('') :
    estadoVazio('Você ainda não tem favoritos', 'Quando encontrar uma oferta interessante, clique em Favoritar.');
}

function alternarFav(id) {
  const favoritos = load(K.favs, []).map(String);
  const chave = String(id);
  const existe = favoritos.includes(chave);
  try {
    save(K.favs, existe ? favoritos.filter((item) => item !== chave) : [...favoritos, chave]);
  } catch {
    aviso('Não foi possível atualizar os favoritos neste navegador.');
    return;
  }
  renderLista();
  renderFavs();
  aviso(existe ? 'Promoção removida dos favoritos.' : 'Promoção adicionada aos favoritos!');
}

/* NAVEGAÇÃO E LOJISTAS */
function mostrar(view) {
  document.querySelectorAll('.view').forEach((secao) => { secao.hidden = secao.id !== `view-${view}`; });
  document.querySelectorAll('[data-view]').forEach((botao) => {
    const ativo = botao.dataset.view === view;
    botao.classList.toggle('ativo', ativo);
    botao.setAttribute('aria-current', ativo ? 'page' : 'false');
  });
  if (view === 'promos') renderLista();
  if (view === 'favs') renderFavs();
  if (view === 'loja') renderLoja();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderLoja() {
  const sessao = load(K.sessao, null);
  const lojas = load(K.lojas, []);
  const loja = sessao ? lojas.find((item) => String(item.id) === String(sessao.id)) : null;
  if (!loja) {
    $('#auth').hidden = false;
    $('#painel').hidden = true;
    if (sessao) localStorage.removeItem(K.sessao);
    return;
  }
  $('#auth').hidden = true;
  $('#painel').hidden = false;
  $('#nomeLoja').textContent = loja.nome;
  const minhas = todasPromocoes()
    .filter((p) => String(p.loja) === String(loja.id))
    .sort((a, b) => Number(b.criada) - Number(a.criada));
  $('#minhas').innerHTML = minhas.length ? minhas.map((p) => cardHTML(p, 'loja')).join('') :
    estadoVazio('Você ainda não publicou ofertas', 'Use o formulário acima para publicar sua primeira promoção.');
}

function cadastrar(evento) {
  evento.preventDefault();
  const dados = Object.fromEntries(new FormData(evento.target));
  const nome = String(dados.nome || '').trim();
  const whatsapp = numeroWhatsApp(dados.whatsapp);
  const senha = String(dados.senha || '');

  if (nome.length < 2) return aviso('Informe o nome da loja.');
  if (whatsapp.length < 10 || whatsapp.length > 13) return aviso('Informe um WhatsApp válido com DDD.');
  if (senha.length < 4) return aviso('A senha deve ter pelo menos 4 caracteres.');

  const lojas = load(K.lojas, []);
  if (lojas.some((l) => numeroWhatsApp(l.whatsapp) === whatsapp)) {
    return aviso('Já existe uma loja cadastrada com esse WhatsApp.');
  }

  const novaLoja = { id: criarId(), nome, whatsapp, senha };
  lojas.push(novaLoja);
  try {
    save(K.lojas, lojas);
    save(K.sessao, { id: novaLoja.id });
  } catch {
    return aviso('Não foi possível salvar o cadastro. Verifique o espaço disponível no navegador.');
  }

  evento.target.reset();
  renderLoja();
  aviso('Loja cadastrada com sucesso!');
}

function entrar(evento) {
  evento.preventDefault();
  const dados = Object.fromEntries(new FormData(evento.target));
  const whatsapp = numeroWhatsApp(dados.whatsapp);
  const senha = String(dados.senha || '');
  const loja = load(K.lojas, []).find((l) => numeroWhatsApp(l.whatsapp) === whatsapp && l.senha === senha);
  if (!loja) return aviso('WhatsApp ou senha incorretos.');

  try {
    save(K.sessao, { id: loja.id });
  } catch {
    return aviso('Não foi possível iniciar a sessão neste navegador.');
  }
  evento.target.reset();
  renderLoja();
  aviso('Login realizado com sucesso!');
}

async function publicar(evento) {
  evento.preventDefault();
  const sessao = load(K.sessao, null);
  const loja = sessao ? load(K.lojas, []).find((l) => String(l.id) === String(sessao.id)) : null;
  if (!loja) {
    aviso('Entre na sua conta de lojista antes de publicar.');
    renderLoja();
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
  const arquivo = $('#arquivoImagem').files[0];

  if (!titulo) return aviso('Informe o nome do produto ou da promoção.');
  if (!Number.isFinite(de) || !Number.isFinite(por) || de <= 0 || por <= 0) return aviso('Informe preços válidos.');
  if (por >= de) return aviso('O preço promocional deve ser menor que o preço original.');
  if (!CATEGORIAS.includes(categoria)) return aviso('Selecione uma categoria válida.');
  if (!validade || validade < hojeISO()) return aviso('Informe uma validade igual ou posterior a hoje.');
  if (link && !imagemValida(link)) return aviso('Informe um link de imagem válido.');

  let imagem = link ? imagemValida(link) : '';
  try {
    if (arquivo) imagem = await arquivoParaImagem(arquivo);
    else if (imagemSelecionada) imagem = imagemSelecionada;
  } catch (erro) {
    return aviso(erro.message);
  }

  const promos = todasPromocoes();
  promos.push({
    id: criarId(), loja: loja.id, titulo, descricao, imagem,
    de, por, categoria, validade, criada: Date.now()
  });

  try {
    save(K.promos, promos);
  } catch (erro) {
    console.error('Erro ao salvar promoção:', erro);
    return aviso('Não foi possível salvar. O armazenamento pode estar cheio. Tente uma imagem menor ou remova ofertas antigas.');
  }

  formulario.reset();
  limparImagem();
  renderLista();
  renderFavs();
  renderLoja();
  aviso('Promoção publicada com sucesso!');
}

function excluir(id) {
  const sessao = load(K.sessao, null);
  if (!sessao) return aviso('Entre na sua conta para excluir uma promoção.');

  const promos = todasPromocoes();
  const promocao = promos.find((p) => String(p.id) === String(id));
  if (!promocao || String(promocao.loja) !== String(sessao.id)) {
    return aviso('Você não pode excluir essa promoção.');
  }
  if (!window.confirm(`Deseja realmente excluir a promoção "${promocao.titulo}"?`)) return;

  try {
    save(K.promos, promos.filter((p) => String(p.id) !== String(id)));
    save(K.favs, load(K.favs, []).filter((item) => String(item) !== String(id)));
  } catch {
    return aviso('Não foi possível excluir a promoção.');
  }
  renderLista();
  renderFavs();
  renderLoja();
  aviso('Promoção excluída.');
}

function sair() {
  localStorage.removeItem(K.sessao);
  renderLoja();
  aviso('Você saiu da sua conta.');
}

function eventos() {
  document.querySelectorAll('[data-view]').forEach((botao) => {
    botao.addEventListener('click', () => mostrar(botao.dataset.view));
  });
  $('#voltar-inicio').addEventListener('click', (e) => { e.preventDefault(); mostrar('promos'); });
  $('#busca').addEventListener('input', renderLista);
  $('#filtroCat').addEventListener('change', renderLista);
  $('#ordem').addEventListener('change', renderLista);
  $('#formCadastro').addEventListener('submit', cadastrar);
  $('#formLogin').addEventListener('submit', entrar);
  $('#formPromo').addEventListener('submit', publicar);
  $('#sair').addEventListener('click', sair);
  $('#arquivoImagem').addEventListener('change', () => atualizarPreview('arquivo'));
  $('#imagem').addEventListener('input', () => atualizarPreview('link'));
  $('#remover-imagem').addEventListener('click', limparImagem);

  document.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-acao]');
    if (!botao) return;
    if (botao.dataset.acao === 'favoritar') alternarFav(botao.dataset.id);
    if (botao.dataset.acao === 'excluir') excluir(botao.dataset.id);
  });

  document.addEventListener('error', (evento) => {
    const img = evento.target;
    if (!(img instanceof HTMLImageElement) || !img.closest('.foto-card')) return;
    img.hidden = true;
    const reserva = img.nextElementSibling;
    if (reserva?.classList.contains('sem-foto')) reserva.hidden = false;
  }, true);
}

function iniciar() {
  if (localStorage.getItem(K.promos) === null) save(K.promos, []);
  if (localStorage.getItem(K.lojas) === null) save(K.lojas, []);
  if (localStorage.getItem(K.favs) === null) save(K.favs, []);
  eventos();
  renderLista();
  renderFavs();
  renderLoja();
  mostrar('promos');
  $('#formPromo [name="validade"]').min = hojeISO();
}

iniciar();
