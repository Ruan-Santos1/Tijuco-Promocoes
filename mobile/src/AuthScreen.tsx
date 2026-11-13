import React, { useState } from 'react';
import { Alert, Text } from 'react-native';
import { supabase } from './supabase';
import { s } from './theme';
import { Btn, Check, Chips, Field, Segment } from './ui';
import { Role } from './types';
import { CATS, cleanInstagram, maskDoc, maskPhone, onlyDigits, RESET_URL, validDoc, validEmail } from './utils';
import { Doc } from './LegalModal';

const WRONG_ROLE: Record<Role, string> = {
  cliente: 'Esta é uma conta de lojista. Toque em "Sou lojista" para entrar.',
  lojista: 'Esta é uma conta de cliente. Toque em "Sou cliente" para entrar ou crie uma conta de lojista com outro e-mail.',
};

export default function AuthScreen({ onLegal, onDone }: { onLegal: (d: Doc) => void; onDone: () => void }) {
  const [role, setRole] = useState<Role>('cliente');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [f, setF] = useState({
    email: '', senha: '', confirmar: '', nome: '', nome_loja: '', nome_responsavel: '', documento: '', telefone: '',
    categoria_loja: '', bairro: '', endereco: '', horario: '', instagram: '',
  });
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const fail = (msg: string) => { Alert.alert('Confira os dados', msg); return false; };

  const login = async () => {
    if (!validEmail(f.email) || !f.senha) return void fail('Informe e-mail e senha.');
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: f.email.trim().toLowerCase(), password: f.senha });
    if (error || !data.user) {
      setBusy(false);
      return void Alert.alert('Não foi possível entrar', 'Confira e-mail e senha. Se acabou de criar a conta, confirme o e-mail primeiro.');
    }
    // Mantém clientes e lojistas separados: cada conta só entra pelo seu lado.
    const { data: loja } = await supabase.from('lojas').select('id').eq('id', data.user.id).maybeSingle();
    const isShop = !!loja || data.user.user_metadata?.tipo === 'lojista';
    setBusy(false);
    if ((role === 'lojista') !== isShop) {
      await supabase.auth.signOut();
      return void Alert.alert('Tipo de conta diferente', WRONG_ROLE[role]);
    }
    setF((p) => ({ ...p, senha: '' }));
    onDone();
  };

  const forgot = async () => {
    if (!validEmail(f.email)) return void fail('Digite seu e-mail no campo acima e toque em "Esqueci minha senha".');
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(f.email.trim().toLowerCase(), { redirectTo: RESET_URL });
    setBusy(false);
    if (error) return void Alert.alert('Não foi possível enviar', error.message);
    Alert.alert('Verifique seu e-mail', 'Se o e-mail estiver cadastrado, enviamos um link para criar uma nova senha. Abra o link no celular em que o app está instalado.');
  };

  const signup = async () => {
    const shop = role === 'lojista';
    const tel = onlyDigits(f.telefone);
    const erro =
      shop && f.nome_loja.trim().length < 2 ? 'Informe o nome da loja.' :
      shop && f.nome_responsavel.trim().length < 3 ? 'Informe o nome do responsável.' :
      shop && !validDoc(f.documento) ? 'CPF ou CNPJ inválido.' :
      shop && ![10, 11].includes(tel.length) ? 'Informe o WhatsApp com DDD.' :
      shop && !CATS.includes(f.categoria_loja) ? 'Escolha a categoria da loja.' :
      shop && (!f.endereco.trim() || !f.bairro.trim()) ? 'Informe endereço e bairro.' :
      !shop && f.nome.trim().length < 2 ? 'Informe seu nome.' :
      !validEmail(f.email) ? 'Informe um e-mail válido.' :
      f.senha.length < 6 ? 'A senha precisa ter pelo menos 6 caracteres.' :
      f.senha !== f.confirmar ? 'As senhas não conferem.' :
      !accepted ? 'Aceite os Termos de Uso e a Política de Privacidade para continuar.' : '';
    if (erro) return void fail(erro);

    const meta = shop
      ? { tipo: 'lojista', nome_loja: f.nome_loja.trim(), nome_responsavel: f.nome_responsavel.trim(), documento: onlyDigits(f.documento), telefone: tel,
          categoria_loja: f.categoria_loja, bairro: f.bairro.trim(), endereco: f.endereco.trim(), horario: f.horario.trim(), instagram: cleanInstagram(f.instagram) }
      : { tipo: 'cliente', nome: f.nome.trim() };

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: f.email.trim().toLowerCase(), password: f.senha,
      options: { data: { ...meta, aceitou_politica_em: new Date().toISOString() } },
    });
    setBusy(false);

    if (error) return void Alert.alert('Não foi possível cadastrar', error.message);
    if (data.user?.identities?.length === 0) return void Alert.alert('E-mail já cadastrado', 'Use "Entrar" com esse e-mail.');
    if (!data.session) {
      setMode('login');
      return void Alert.alert('Confirme seu e-mail', 'Enviamos um link de confirmação. Depois de confirmar, é só entrar.');
    }
    onDone();
  };

  return (
    <>
      <Text style={s.heading}>Minha conta</Text>
      <Segment items={[{ id: 'cliente', label: 'Sou cliente', icon: 'person-outline' }, { id: 'lojista', label: 'Sou lojista', icon: 'storefront-outline' }]} value={role} onChange={(v) => { setRole(v as Role); setAccepted(false); }} />
      <Text style={[s.muted, { marginHorizontal: 20 }]}>
        {role === 'cliente' ? 'Salve ofertas favoritas e compartilhe com amigos.' : 'Cadastre sua loja e publique promoções para toda a cidade.'}
      </Text>
      <Segment items={[{ id: 'login', label: 'Entrar' }, { id: 'signup', label: 'Criar conta' }]} value={mode} onChange={(v) => setMode(v as 'login' | 'signup')} />

      {mode === 'signup' && role === 'cliente' && <Field label="Seu nome" value={f.nome} onChange={set('nome')} autoCapitalize="words" />}
      {mode === 'signup' && role === 'lojista' && (
        <>
          <Field label="Nome da loja" value={f.nome_loja} onChange={set('nome_loja')} autoCapitalize="words" />
          <Field label="Nome do responsável" value={f.nome_responsavel} onChange={set('nome_responsavel')} autoCapitalize="words" />
          <Field label="CPF ou CNPJ" value={f.documento} onChange={(v) => set('documento')(maskDoc(v))} keyboard="number-pad" hint="Não aparece para o público." />
          <Field label="WhatsApp da loja" value={f.telefone} onChange={(v) => set('telefone')(maskPhone(v))} keyboard="phone-pad" placeholder="(34) 99999-9999" />
          <Text style={[s.label, { marginHorizontal: 20, marginTop: 12 }]}>Categoria principal</Text>
          <Chips items={CATS} value={f.categoria_loja} onChange={set('categoria_loja')} icons />
          <Field label="Endereço" value={f.endereco} onChange={set('endereco')} placeholder="Rua e número" />
          <Field label="Bairro" value={f.bairro} onChange={set('bairro')} />
          <Field label="Horário de funcionamento (opcional)" value={f.horario} onChange={set('horario')} placeholder="Seg a Sáb, 8h às 18h" />
          <Field label="Instagram (opcional)" value={f.instagram} onChange={set('instagram')} placeholder="@sualoja" autoCapitalize="none" />
        </>
      )}
      <Field label="E-mail" value={f.email} onChange={set('email')} keyboard="email-address" placeholder="voce@email.com" />
      <Field label="Senha" value={f.senha} onChange={set('senha')} secure placeholder="Mínimo 6 caracteres" />
      {mode === 'signup' && <Field label="Confirmar senha" value={f.confirmar} onChange={set('confirmar')} secure />}
      {mode === 'signup' && (
        <Check checked={accepted} onToggle={() => setAccepted(!accepted)}>
          Li e aceito os <Text style={s.link} onPress={() => onLegal('termos')}>Termos de Uso</Text> e a <Text style={s.link} onPress={() => onLegal('privacidade')}>Política de Privacidade</Text>.
        </Check>
      )}
      <Btn label={busy ? 'Aguarde...' : mode === 'login' ? 'Entrar' : role === 'lojista' ? 'Cadastrar minha loja' : 'Criar conta de cliente'} onPress={mode === 'login' ? login : signup} disabled={busy} />
      {mode === 'login' && <Btn label="Esqueci minha senha" kind="secondary" onPress={forgot} disabled={busy} />}
    </>
  );
}
