import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * Cria o perfil certo (cliente ou loja) a partir dos dados informados no cadastro.
 * Roda no primeiro login, inclusive quando o e-mail precisa ser confirmado antes.
 */
export async function ensureProfile(user: User) {
  const m = (user.user_metadata || {}) as Record<string, string | undefined>;
  const { data: loja } = await supabase.from('lojas').select('id').eq('id', user.id).maybeSingle();

  if (loja) return; // loja já cadastrada (inclui contas antigas)

  if (m.tipo === 'lojista') {
    const { error } = await supabase.from('lojas').upsert({
      id: user.id,
      nome_loja: m.nome_loja || 'Minha loja',
      telefone: m.telefone || null,
      categoria_loja: m.categoria_loja || null,
      bairro: m.bairro || null,
      endereco: m.endereco || null,
      horario: m.horario || null,
      instagram: m.instagram || null,
      cidade: 'Ituiutaba',
      estado: 'MG',
    });
    if (error) return console.log('Erro ao criar loja:', error.message);

    const { error: e2 } = await supabase.from('lojas_privado').upsert({
      id: user.id,
      documento: m.documento || null,
      responsavel: m.nome_responsavel || null,
      aceitou_politica_em: m.aceitou_politica_em || null,
    });
    if (e2) console.log('Erro ao salvar dados privados:', e2.message);
    return;
  }

  const { data: cliente } = await supabase.from('clientes').select('id').eq('id', user.id).maybeSingle();
  if (!cliente) {
    const { error } = await supabase.from('clientes').insert({
      id: user.id,
      nome: m.nome || null,
      aceitou_politica_em: m.aceitou_politica_em || null,
    });
    if (error) console.log('Erro ao criar cliente:', error.message);
  }
}
