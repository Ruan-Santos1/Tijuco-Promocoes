import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, RefreshControl, SafeAreaView, ScrollView, Share,
  StatusBar, Text, TouchableOpacity, View,
} from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from './src/supabase';
import { ensureProfile } from './src/profile';
import { s, C } from './src/theme';
import { Loja, Promo, Role, Sort, Tab } from './src/types';
import { Btn, Chips, Field, PromoCard, Segment } from './src/ui';
import AuthScreen from './src/AuthScreen';
import StoreScreen from './src/StoreScreen';
import PromoDetail from './src/PromoDetail';
import LegalModal, { Doc } from './src/LegalModal';
import ReportModal from './src/ReportModal';
import NewPasswordModal from './src/NewPasswordModal';
import { CATS, CAT_ICONS, discount, parseRecovery, shareMessage, storeOf, todayIso } from './src/utils';

const COLS = 'id,loja_id,titulo,descricao,preco,preco_original,imagem_url,categoria,validade,ativa,created_at,lojas(nome_loja,cidade,estado,bairro,endereco,telefone,horario,instagram)';
const PAGE = 15;
const NAV: Record<Tab, [string, string]> = { Inicio: ['🏠', 'Início'], Buscar: ['🔎', 'Buscar'], Favoritos: ['❤️', 'Favoritos'], Loja: ['🏪', 'Minha loja'], Perfil: ['👤', 'Perfil'] };

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState<Tab>('Inicio');
  const [promos, setPromos] = useState<Promo[]>([]);
  const [mine, setMine] = useState<Promo[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [shop, setShop] = useState<Loja | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<Sort>('recentes');
  const [visible, setVisible] = useState(PAGE);
  const [selected, setSelected] = useState<Promo | null>(null);
  const [legal, setLegal] = useState<Doc | null>(null);
  const [reporting, setReporting] = useState<Promo | null>(null);
  const [newPass, setNewPass] = useState(false);
  const [linkedId, setLinkedId] = useState<string | null>(null);

  /* ---------- sessão ---------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess));
    return () => subscription.unsubscribe();
  }, []);

  /* ---------- dados ---------- */
  const loadPromos = useCallback(async () => {
    setBusy(true);
    const { data, error } = await supabase.from('promocoes').select(COLS).eq('ativa', true)
      .or(`validade.is.null,validade.gte.${todayIso()}`).order('created_at', { ascending: false });
    if (error) Alert.alert('Não foi possível carregar as ofertas', error.message); else setPromos((data || []) as unknown as Promo[]);
    setBusy(false);
  }, []);

  const loadUser = useCallback(async () => {
    const user = session?.user;
    if (!user) { setFavorites([]); setShop(null); setMine([]); setRole(null); return; }
    await ensureProfile(user);
    const [{ data: fav }, { data: loja }] = await Promise.all([
      supabase.from('favoritos').select('promocao_id').eq('usuario_id', user.id),
      supabase.from('lojas').select('*').eq('id', user.id).maybeSingle(),
    ]);
    setFavorites((fav || []).map((x) => x.promocao_id as string));
    setShop(loja as Loja | null);
    setRole(loja ? 'lojista' : 'cliente');
    if (loja) {
      const { data: m } = await supabase.from('promocoes').select(COLS).eq('loja_id', user.id).order('created_at', { ascending: false });
      setMine((m || []) as unknown as Promo[]);
    } else setMine([]);
  }, [session]);

  useEffect(() => { loadPromos(); }, [loadPromos]);
  useEffect(() => { loadUser(); }, [loadUser]);

  const reloadAll = useCallback(async () => { await Promise.all([loadPromos(), loadUser()]); }, [loadPromos, loadUser]);
  const refresh = async () => { setRefreshing(true); await reloadAll(); setRefreshing(false); };

  /* ---------- links: tijuco://promo/ID e tijuco://reset-password ---------- */
  const handleRecovery = useCallback(async (rec: ReturnType<typeof parseRecovery>) => {
    if (!rec) return;
    const invalid = () => Alert.alert('Link inválido', 'O link expirou ou já foi usado. Peça um novo em "Esqueci minha senha".');
    if ('error' in rec) return void invalid();
    const { error } = await supabase.auth.setSession(rec);
    if (error) return void invalid();
    setNewPass(true);
  }, []);

  useEffect(() => {
    const read = (url?: string | null) => {
      const rec = parseRecovery(url);
      if (rec) return void handleRecovery(rec);
      const m = url && /promo\/([A-Za-z0-9-]+)/.exec(url);
      if (m) setLinkedId(m[1]);
    };
    Linking.getInitialURL().then(read).catch(() => undefined);
    const sub = Linking.addEventListener('url', (e) => read(e.url));
    return () => sub.remove();
  }, [handleRecovery]);

  useEffect(() => {
    if (!linkedId || busy) return;
    (async () => {
      let found: Promo | undefined = promos.find((p) => p.id === linkedId);
      if (!found) {
        const { data } = await supabase.from('promocoes').select(COLS).eq('id', linkedId).eq('ativa', true).maybeSingle();
        found = (data as unknown as Promo | null) ?? undefined;
      }
      if (found) setSelected(found); else Alert.alert('Oferta indisponível', 'Essa promoção não existe mais ou já terminou.');
      setLinkedId(null);
    })();
  }, [linkedId, busy, promos]);

  /* ---------- ações ---------- */
  const share = async (p: Promo) => { try { await Share.share({ message: shareMessage(p), title: p.titulo }); } catch { /* cancelado */ } };

  const toggleFavorite = async (p: Promo) => {
    if (!session) { Alert.alert('Entre na conta', 'Faça login para salvar seus favoritos.'); setTab('Perfil'); setSelected(null); return; }
    const has = favorites.includes(p.id);
    const { error } = has
      ? await supabase.from('favoritos').delete().eq('usuario_id', session.user.id).eq('promocao_id', p.id)
      : await supabase.from('favoritos').insert({ usuario_id: session.user.id, promocao_id: p.id });
    if (error) Alert.alert('Erro', error.message);
    else setFavorites((prev) => (has ? prev.filter((id) => id !== p.id) : [...prev, p.id]));
  };

  const reportPromo = (p: Promo) => {
    setSelected(null);
    if (!session) { Alert.alert('Entre na conta', 'Faça login para denunciar uma oferta.'); setTab('Perfil'); return; }
    if (p.loja_id === session.user.id) return void Alert.alert('Não é possível', 'Você não pode denunciar a sua própria oferta.');
    setReporting(p);
  };

  const signOut = async () => { await supabase.auth.signOut(); setTab('Inicio'); };

  const deleteAccount = () => Alert.alert(
    'Excluir minha conta',
    role === 'lojista' ? 'Sua loja, suas ofertas e seus dados serão apagados. Essa ação não pode ser desfeita.' : 'Seu cadastro e seus favoritos serão apagados. Essa ação não pode ser desfeita.',
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        const { error } = await supabase.rpc('excluir_minha_conta');
        if (error) return Alert.alert('Não foi possível excluir', error.message);
        await supabase.auth.signOut(); setTab('Inicio'); Alert.alert('Conta excluída', 'Seus dados foram removidos.');
      } },
    ],
  );

  /* ---------- lista filtrada ---------- */
  const list = useMemo(() => {
    const term = search.toLowerCase().trim();
    const out = promos.filter((p) => {
      const l = storeOf(p.lojas);
      const match = !term || [p.titulo, p.descricao, l?.nome_loja, l?.bairro].some((x) => x?.toLowerCase().includes(term));
      return match && (!category || p.categoria === category) && (tab !== 'Favoritos' || favorites.includes(p.id));
    });
    const price = (p: Promo) => Number(p.preco);
    if (sort === 'desconto') out.sort((a, b) => discount(b) - discount(a));
    if (sort === 'menor-preco') out.sort((a, b) => price(a) - price(b));
    if (sort === 'vence-logo') out.sort((a, b) => (a.validade ?? '9999').localeCompare(b.validade ?? '9999'));
    return out;
  }, [promos, search, category, sort, tab, favorites]);

  useEffect(() => setVisible(PAGE), [search, category, sort, tab]);

  const isFeed = tab === 'Inicio' || tab === 'Buscar' || tab === 'Favoritos';
  const tabs: Tab[] = ['Inicio', 'Buscar', 'Favoritos', ...(role === 'lojista' ? (['Loja'] as Tab[]) : []), 'Perfil'];

  const categoryBar = (
    <>
      <Text style={s.section}>Categorias</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {CATS.map((c) => (
          <TouchableOpacity key={c} style={[s.chip, category === c && s.chipOn]} onPress={() => setCategory(category === c ? '' : c)}>
            <Text style={[s.chipText, category === c && s.chipTextOn]}>{CAT_ICONS[c]} {c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.green} />}>
          <View style={s.header}>
            <View>
              <Text style={s.logo}>Tijuco <Text style={{ color: C.green }}>Promoções</Text></Text>
              <Text style={s.muted}>📍 Ituiutaba, Minas Gerais</Text>
            </View>
            <TouchableOpacity onPress={() => setTab('Perfil')} style={s.avatar} accessibilityLabel="Minha conta"><Text>👤</Text></TouchableOpacity>
          </View>

          {tab === 'Inicio' && (
            <>
              <View style={s.banner}>
                <Text style={s.kicker}>ECONOMIZE NO COMÉRCIO LOCAL</Text>
                <Text style={s.bannerTitle}>{'As melhores ofertas,\nperto de você!'}</Text>
                <Text style={s.bannerSub}>Promoções especiais de lojas da nossa cidade.</Text>
              </View>
              <Field label="" value={search} onChange={setSearch} placeholder="🔎 O que você procura?" />
              {categoryBar}
            </>
          )}

          {tab === 'Buscar' && (
            <>
              <Text style={s.heading}>Buscar ofertas</Text>
              <Field label="" value={search} onChange={setSearch} placeholder="Produto, loja ou bairro" />
              {categoryBar}
              <Text style={s.section}>Ordenar por</Text>
              <Chips items={['Mais recentes', 'Maior desconto', 'Menor preço', 'Vence logo']}
                value={({ recentes: 'Mais recentes', desconto: 'Maior desconto', 'menor-preco': 'Menor preço', 'vence-logo': 'Vence logo' } as Record<Sort, string>)[sort]}
                onChange={(v) => setSort(({ 'Mais recentes': 'recentes', 'Maior desconto': 'desconto', 'Menor preço': 'menor-preco', 'Vence logo': 'vence-logo' } as Record<string, Sort>)[v])} />
            </>
          )}

          {tab === 'Favoritos' && (
            <>
              <Text style={s.heading}>❤️ Favoritos</Text>
              <Text style={[s.muted, { marginHorizontal: 20 }]}>Ofertas que você salvou</Text>
              {!session && (
                <View style={s.notice}>
                  <Text>Entre na sua conta para guardar seus favoritos.</Text>
                  <Btn label="Entrar ou criar conta" kind="secondary" onPress={() => setTab('Perfil')} />
                </View>
              )}
            </>
          )}

          {isFeed && (
            <>
              <Text style={s.section}>{tab === 'Favoritos' ? 'Suas ofertas salvas' : tab === 'Buscar' ? `${list.length} resultado(s)` : 'Ofertas em destaque'}</Text>
              {busy && <ActivityIndicator color={C.green} />}
              {list.slice(0, visible).map((p) => (
                <PromoCard key={p.id} p={p} favorite={favorites.includes(p.id)} onPress={() => setSelected(p)} onFav={() => toggleFavorite(p)} onShare={() => share(p)} />
              ))}
              {!busy && list.length === 0 && (
                <View style={s.empty}><Text style={{ fontSize: 36 }}>🛍️</Text><Text style={s.muted}>{tab === 'Favoritos' ? 'Você ainda não salvou ofertas.' : 'Nenhuma oferta encontrada.'}</Text></View>
              )}
              {list.length > visible && <Btn label="Ver mais ofertas" kind="secondary" onPress={() => setVisible(visible + PAGE)} />}
            </>
          )}

          {tab === 'Perfil' && (
            <>
              {session ? (
                <>
                  <Text style={s.heading}>Minha conta</Text>
                  <View style={s.panel}>
                    <Text style={s.panelTitle}>{role === 'lojista' ? '🏪 Conta de lojista' : '🛍️ Conta de cliente'}</Text>
                    <Text style={s.panelText}>{session.user.email}</Text>
                    {role === 'lojista' && <Btn label="Gerenciar minha loja" kind="secondary" onPress={() => setTab('Loja')} />}
                    <Btn label="Sair da conta" onPress={signOut} />
                  </View>
                  <View style={s.panel}>
                    <Text style={s.panelTitle}>Privacidade e dados</Text>
                    <Text style={s.panelText}>Saiba como tratamos seus dados e exerça seus direitos pela LGPD.</Text>
                    <Btn label="Termos de Uso" kind="secondary" onPress={() => setLegal('termos')} />
                    <Btn label="Política de Privacidade" kind="secondary" onPress={() => setLegal('privacidade')} />
                    <Btn label="Excluir minha conta" kind="danger" onPress={deleteAccount} />
                  </View>
                </>
              ) : (
                <AuthScreen onLegal={setLegal} onDone={() => setTab('Inicio')} />
              )}
            </>
          )}

          {tab === 'Loja' && session && shop && role === 'lojista' && (
            <StoreScreen key={shop.id} userId={session.user.id} shop={shop} mine={mine} reload={reloadAll} onShare={share} />
          )}

          <Text style={s.footer}>Feito para valorizar o comércio de Ituiutaba ❤️{'\n'}
            <Text style={s.link} onPress={() => setLegal('termos')}>Termos de Uso</Text>{'  ·  '}
            <Text style={s.link} onPress={() => setLegal('privacidade')}>Política de Privacidade</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={s.nav}>
        {tabs.map((t) => (
          <TouchableOpacity key={t} style={s.navItem} onPress={() => setTab(t)} accessibilityRole="tab" accessibilityState={{ selected: tab === t }}>
            <Text style={{ fontSize: 20 }}>{NAV[t][0]}</Text>
            <Text style={[s.navText, tab === t && s.navActive]}>{NAV[t][1]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <PromoDetail promo={selected} favorite={!!selected && favorites.includes(selected.id)} onFav={() => selected && toggleFavorite(selected)}
        onShare={() => selected && share(selected)} onClose={() => setSelected(null)} onReport={() => selected && reportPromo(selected)} />
      <ReportModal promo={reporting} userId={session?.user.id} onClose={() => setReporting(null)} />
      <NewPasswordModal visible={newPass} onClose={() => setNewPass(false)} />
      <LegalModal doc={legal} onClose={() => setLegal(null)} />
    </SafeAreaView>
  );
}
