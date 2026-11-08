import { Loja, Promo } from './types';

export const CATS = ['Mercado', 'Padaria', 'Moda', 'Eletrônicos', 'Farmácia', 'Restaurante', 'Casa', 'Outros'];
export const CAT_ICONS: Record<string, string> = {
  Mercado: '🛒', Padaria: '🥖', Moda: '👕', 'Eletrônicos': '📱', 'Farmácia': '💊', Restaurante: '🍔', Casa: '🏠', Outros: '✨',
};

export const storeOf = (l?: Loja | Loja[] | null): Loja | undefined => (Array.isArray(l) ? l[0] : l ?? undefined);
export const onlyDigits = (v: string) => v.replace(/\D/g, '');
export const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/* ---------- Dinheiro ---------- */
export const money = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Consulte';
};
export const fmtMoneyNum = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** Digita só números e o campo vira 19,90 automaticamente. */
export const maskMoney = (v: string) => {
  const d = onlyDigits(v).slice(0, 9);
  return d ? fmtMoneyNum(Number(d) / 100) : '';
};
export const parseMoney = (v: string): number | null => {
  if (!v.trim()) return null;
  const n = Number(v.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
export const discount = (p: Pick<Promo, 'preco' | 'preco_original'>) => {
  const a = Number(p.preco), o = Number(p.preco_original);
  return o > a && a >= 0 && o > 0 ? Math.round(((o - a) / o) * 100) : 0;
};

/* ---------- Máscaras e validações ---------- */
export const maskPhone = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export const maskDoc = (v: string) => {
  const d = onlyDigits(v).slice(0, 14);
  if (d.length <= 11) {
    return d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
  }
  return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

export const validDoc = (v: string) => {
  const d = onlyDigits(v);
  if (/^(\d)\1+$/.test(d)) return false;
  const dig = (base: string, w: number[]) => {
    const r = base.split('').reduce((t, n, i) => t + Number(n) * w[i], 0) % 11;
    return r < 2 ? 0 : 11 - r;
  };
  if (d.length === 11) {
    return dig(d.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[9]) && dig(d.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[10]);
  }
  if (d.length === 14) {
    const w = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    return dig(d.slice(0, 12), w) === Number(d[12]) && dig(d.slice(0, 13), [6, ...w]) === Number(d[13]);
  }
  return false;
};

export const cleanInstagram = (v: string) =>
  v.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/[/?].*$/, '').replace(/[^A-Za-z0-9._]/g, '');

/* ---------- Datas ---------- */
const pad = (n: number) => String(n).padStart(2, '0');
export const todayIso = (addDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + addDays);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const isoToBr = (iso: string) => iso.split('-').reverse().join('/');
export const maskDate = (v: string) => {
  const d = onlyDigits(v).slice(0, 8);
  return d.replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
};
/** Converte DD/MM/AAAA em AAAA-MM-DD; devolve null se a data não existir. */
export const brToIso = (br: string): string | null => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d ? `${y}-${pad(mo)}-${pad(d)}` : null;
};
export const daysLeft = (iso?: string | null) => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  return Math.round((new Date(y, m - 1, d).getTime() - hoje.getTime()) / 86400000);
};
export const statusOf = (p: Promo): 'ativa' | 'pausada' | 'expirada' => {
  const d = daysLeft(p.validade);
  return d !== null && d < 0 ? 'expirada' : p.ativa ? 'ativa' : 'pausada';
};

/* ---------- Links e compartilhamento ---------- */
export const promoLink = (id: string) => `tijuco://promo/${id}`;

export const shareMessage = (p: Promo) => {
  const l = storeOf(p.lojas);
  const off = discount(p);
  return [
    `🔥 ${p.titulo}`,
    `Por ${money(p.preco)}${Number(p.preco_original) > Number(p.preco) ? ` (de ${money(p.preco_original)})` : ''}${off ? ` – ${off}% OFF` : ''}`,
    l?.nome_loja ? `🏪 ${l.nome_loja}${l.bairro ? ` – ${l.bairro}` : ''}` : '',
    p.validade ? `📅 Válida até ${isoToBr(p.validade)}` : '',
    '',
    `Veja no app Tijuco Promoções: ${promoLink(p.id)}`,
  ].filter((x, i, a) => x !== '' || (i > 0 && a[i - 1] !== '')).join('\n');
};

export const whatsappUrl = (phone?: string | null, text = '') => {
  const d = onlyDigits(phone || '');
  if (d.length < 10) return '';
  return `https://wa.me/${d.startsWith('55') && d.length >= 12 ? d : `55${d}`}?text=${encodeURIComponent(text)}`;
};

export const mapsUrl = (l?: Loja) =>
  l?.endereco ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${l.endereco}, ${l.bairro || ''}, ${l.cidade || 'Ituiutaba'} - ${l.estado || 'MG'}`)}` : '';

/* ---------- Imagem ---------- */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
export const base64ToBytes = (b64: string): Uint8Array => {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const n = [0, 1, 2, 3].map((k) => (i + k < clean.length ? B64.indexOf(clean[i + k]) : 0));
    const chunk = (n[0] << 18) | (n[1] << 12) | (n[2] << 6) | n[3];
    if (o < out.length) out[o++] = (chunk >> 16) & 255;
    if (o < out.length) out[o++] = (chunk >> 8) & 255;
    if (o < out.length) out[o++] = chunk & 255;
  }
  return out;
};

/* ---------- Recuperação de senha ---------- */
export const RESET_URL = 'tijuco://reset-password';

export function parseRecovery(url?: string | null): { access_token: string; refresh_token: string } | { error: string } | null {
  if (!url || !url.includes('reset-password')) return null;
  const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1] || '');
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (access_token && refresh_token) return { access_token, refresh_token };
  return { error: (params.get('error_description') || 'Link inválido ou expirado.').replace(/\+/g, ' ') };
}
