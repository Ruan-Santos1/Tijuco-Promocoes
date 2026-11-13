import React, { useState } from 'react';
import { Alert, Image, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';
import { C, s } from './theme';
import { Btn, Chips, Field, Icon, PromoCard } from './ui';
import { Loja, Promo } from './types';
import {
  base64ToBytes, brToIso, CATS, daysLeft, discount, fmtMoneyNum, isoToBr, maskDate, maskMoney, maskPhone,
  money, parseMoney, statusOf, todayIso, cleanInstagram,
} from './utils';

type Props = { userId: string; shop: Loja; mine: Promo[]; reload: () => Promise<void>; onShare: (p: Promo) => void };
type Draft = { titulo: string; descricao: string; preco: string; preco_original: string; categoria: string; validade: string };
type Photo = { uri: string; base64?: string | null };

const emptyDraft = (): Draft => ({ titulo: '', descricao: '', preco: '', preco_original: '', categoria: 'Mercado', validade: '' });
const QUICK = [{ label: 'Hoje', d: 0 }, { label: '3 dias', d: 3 }, { label: '7 dias', d: 7 }, { label: '15 dias', d: 15 }, { label: '30 dias', d: 30 }];

export default function StoreScreen({ userId, shop, mine, reload, onShare }: Props) {
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState({
    nome_loja: shop.nome_loja || '', telefone: shop.telefone ? maskPhone(shop.telefone) : '', bairro: shop.bairro || '', endereco: shop.endereco || '',
    horario: shop.horario || '', instagram: shop.instagram || '', categoria_loja: shop.categoria_loja || '',
  });
  const setD = (k: keyof Draft) => (v: string) => setDraft((p) => ({ ...p, [k]: v }));

  /* ---------- foto ---------- */
  const pick = async (camera: boolean) => {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return void Alert.alert('Permissão necessária', camera ? 'Permita o uso da câmera para tirar a foto.' : 'Permita o acesso às fotos para escolher a imagem.');
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.6, base64: true };
    const r = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!r.canceled && r.assets[0]) setPhoto({ uri: r.assets[0].uri, base64: r.assets[0].base64 });
  };

  const choosePhoto = () => Alert.alert('Foto da oferta', 'De onde vem a foto?', [
    { text: 'Câmera', onPress: () => pick(true) }, { text: 'Galeria', onPress: () => pick(false) }, { text: 'Cancelar', style: 'cancel' },
  ]);

  const uploadPhoto = async (ph: Photo): Promise<string> => {
    if (!ph.base64) throw new Error('Não foi possível ler a foto.');
    const path = `${userId}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('promocoes').upload(path, base64ToBytes(ph.base64), { contentType: 'image/jpeg' });
    if (!error) return supabase.storage.from('promocoes').getPublicUrl(path).data.publicUrl;
    if (ph.base64.length > 400000) throw new Error('A foto é grande demais. Escolha outra.');
    return `data:image/jpeg;base64,${ph.base64}`; // reserva caso o bucket ainda não exista
  };

  /* ---------- oferta ---------- */
  const reset = () => { setDraft(emptyDraft()); setPhoto(null); setCurrentUrl(null); setEditingId(null); };

  const startEdit = (p: Promo) => {
    setEditingId(p.id); setPhoto(null); setCurrentUrl(p.imagem_url ?? null);
    setDraft({
      titulo: p.titulo, descricao: p.descricao ?? '', preco: fmtMoneyNum(Number(p.preco)),
      preco_original: p.preco_original ? fmtMoneyNum(Number(p.preco_original)) : '', categoria: p.categoria ?? 'Mercado', validade: p.validade ? isoToBr(p.validade) : '',
    });
  };

  const price = parseMoney(draft.preco);
  const old = parseMoney(draft.preco_original);
  const off = price !== null && old !== null ? discount({ preco: price, preco_original: old }) : 0;

  const publish = async () => {
    const validade = draft.validade ? brToIso(draft.validade) : null;
    const erro =
      draft.titulo.trim().length < 3 ? 'Dê um título para a oferta.' :
      price === null || price <= 0 ? 'Informe o preço da promoção.' :
      old !== null && old <= price ? 'O preço original deve ser maior que o preço da promoção.' :
      !validade ? 'Escolha até quando a oferta vale.' :
      validade < todayIso() ? 'A validade não pode estar no passado.' : '';
    if (erro) return void Alert.alert('Confira os dados', erro);

    setSaving(true);
    try {
      const imagem_url = photo ? await uploadPhoto(photo) : currentUrl;
      const row = { titulo: draft.titulo.trim(), descricao: draft.descricao.trim() || null, preco: price, preco_original: old, imagem_url, categoria: draft.categoria, validade, ativa: true };
      const { error } = editingId
        ? await supabase.from('promocoes').update(row).eq('id', editingId).eq('loja_id', userId)
        : await supabase.from('promocoes').insert({ ...row, loja_id: userId });
      if (error) throw error;
      reset();
      await reload();
      Alert.alert(editingId ? 'Oferta atualizada' : 'Oferta publicada', 'Ela já aparece para os clientes.');
    } catch (e) {
      Alert.alert('Não foi possível salvar', e instanceof Error ? e.message : 'Tente novamente.');
    }
    setSaving(false);
  };

  const toggle = async (p: Promo) => {
    const { error } = await supabase.from('promocoes').update({ ativa: !p.ativa }).eq('id', p.id).eq('loja_id', userId);
    if (error) Alert.alert('Erro', error.message); else await reload();
  };

  const remove = (p: Promo) => Alert.alert('Excluir oferta', `Excluir "${p.titulo}"? Essa ação não pode ser desfeita.`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: async () => {
      const { error } = await supabase.from('promocoes').delete().eq('id', p.id).eq('loja_id', userId);
      if (error) Alert.alert('Erro', error.message); else { if (editingId === p.id) reset(); await reload(); }
    } },
  ]);

  /* ---------- perfil da loja ---------- */
  const saveProfile = async () => {
    if (profile.nome_loja.trim().length < 2) return void Alert.alert('Nome obrigatório', 'Informe o nome da loja.');
    const { error } = await supabase.from('lojas').update({
      nome_loja: profile.nome_loja.trim(), telefone: profile.telefone.replace(/\D/g, '') || null, bairro: profile.bairro.trim() || null,
      endereco: profile.endereco.trim() || null, horario: profile.horario.trim() || null, instagram: cleanInstagram(profile.instagram) || null,
      categoria_loja: profile.categoria_loja || null,
    }).eq('id', userId);
    if (error) Alert.alert('Não foi possível salvar', error.message); else { await reload(); setShowProfile(false); Alert.alert('Loja atualizada', 'Os dados foram salvos.'); }
  };

  const setP = (k: keyof typeof profile) => (v: string) => setProfile((p) => ({ ...p, [k]: v }));
  const count = (st: string) => mine.filter((p) => statusOf(p) === st).length;
  const draftPromo: Promo = {
    id: 'previa', loja_id: userId, titulo: draft.titulo, descricao: draft.descricao, preco: price ?? 0, preco_original: old, imagem_url: photo?.uri ?? currentUrl,
    categoria: draft.categoria, validade: draft.validade ? brToIso(draft.validade) : null, ativa: true, lojas: shop,
  };

  return (
    <>
      <Text style={s.heading}>{shop.nome_loja}</Text>
      <View style={s.stats}>
        {[['ativa', 'Ativas'], ['pausada', 'Pausadas'], ['expirada', 'Vencidas']].map(([k, l]) => (
          <View key={k} style={s.stat}><Text style={s.statNum}>{count(k)}</Text><Text style={s.muted}>{l}</Text></View>
        ))}
      </View>

      <View style={s.panel}>
        <Text style={s.panelTitle}>{editingId ? 'Editar oferta' : 'Nova oferta'}</Text>
        <Text style={s.panelText}>Veja a prévia do cartão enquanto preenche.</Text>

        <Field label="Título" value={draft.titulo} onChange={setD('titulo')} placeholder="Ex.: Café 500 g" maxLength={60} />
        <Field label="Descrição (opcional)" value={draft.descricao} onChange={setD('descricao')} multiline maxLength={200} hint={`${draft.descricao.length}/200`} />

        <Text style={[s.label, { marginHorizontal: 20, marginTop: 12 }]}>Foto</Text>
        <TouchableOpacity style={s.pickPhoto} onPress={choosePhoto} accessibilityRole="button">
          {photo?.uri || currentUrl ? <Image source={{ uri: photo?.uri ?? currentUrl! }} style={s.image} /> : (
            <>
              <Icon name="camera-outline" size={30} color={C.navyMid} />
              <Text style={s.panelText}>Toque para tirar ou escolher uma foto</Text>
            </>
          )}
        </TouchableOpacity>
        {(photo || currentUrl) && <Btn label="Remover foto" kind="secondary" onPress={() => { setPhoto(null); setCurrentUrl(null); }} />}

        <Field label="Preço da promoção (R$)" value={draft.preco} onChange={(v) => setD('preco')(maskMoney(v))} keyboard="number-pad" placeholder="0,00" />
        <Field label="Preço original (R$, opcional)" value={draft.preco_original} onChange={(v) => setD('preco_original')(maskMoney(v))} keyboard="number-pad" placeholder="0,00" />
        {off > 0 && price !== null && old !== null && <Text style={s.savings}>{off}% OFF · economia de {money(old - price)}</Text>}

        <Text style={[s.label, { marginHorizontal: 20, marginTop: 14 }]}>Categoria</Text>
        <Chips items={CATS} value={draft.categoria} onChange={setD('categoria')} icons />

        <Text style={[s.label, { marginHorizontal: 20, marginTop: 14 }]}>Válida até</Text>
        <View style={s.chips}>
          {QUICK.map((q) => {
            const br = isoToBr(todayIso(q.d));
            return (
              <TouchableOpacity key={q.label} style={[s.chip, draft.validade === br && s.chipOn]} onPress={() => setD('validade')(br)}>
                <Text style={[s.chipText, draft.validade === br && s.chipTextOn]}>{q.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Field label="" value={draft.validade} onChange={(v) => setD('validade')(maskDate(v))} keyboard="number-pad" placeholder="ou digite DD/MM/AAAA" />

        <Text style={[s.label, { marginHorizontal: 20, marginTop: 16 }]}>Prévia</Text>
        <View style={s.preview}><PromoCard p={draftPromo} /></View>

        <Btn label={saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Publicar oferta'} onPress={publish} disabled={saving} />
        {editingId && <Btn label="Cancelar edição" kind="secondary" onPress={reset} />}
      </View>

      <Text style={s.section}>Minhas ofertas</Text>
      {mine.length === 0 && <View style={s.empty}><Text style={s.muted}>Você ainda não publicou ofertas.</Text></View>}
      {mine.map((p) => {
        const st = statusOf(p);
        const d = daysLeft(p.validade);
        return (
          <View key={p.id}>
            <PromoCard p={{ ...p, lojas: shop }} />
            <View style={[s.rowBtns, { marginTop: -6, marginBottom: 10 }]}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 6 }}>
                <Icon name={st === 'ativa' ? 'ellipse' : st === 'pausada' ? 'pause-outline' : 'hourglass-outline'} size={st === 'ativa' ? 9 : 13} color={st === 'ativa' ? C.success : C.warning} />
                <Text style={[s.badgeText, { flexShrink: 1, color: st === 'ativa' ? C.success : C.warning }]}>
                  {st === 'ativa' ? `Ativa${d !== null ? ` · vence em ${d} dia(s)` : ''}` : st === 'pausada' ? 'Pausada' : 'Vencida'}
                </Text>
              </View>
              <TouchableOpacity style={s.iconBtn} onPress={() => startEdit(p)}><Text style={s.iconBtnText}>Editar</Text></TouchableOpacity>
              {st !== 'expirada' && <TouchableOpacity style={[s.iconBtn, { marginLeft: 6 }]} onPress={() => toggle(p)}><Text style={s.iconBtnText}>{p.ativa ? 'Pausar' : 'Reativar'}</Text></TouchableOpacity>}
              <TouchableOpacity style={[s.iconBtn, { marginLeft: 6 }]} onPress={() => onShare({ ...p, lojas: shop })} accessibilityLabel="Compartilhar"><Icon name="share-social-outline" size={14} color={C.navy} /></TouchableOpacity>
              <TouchableOpacity style={[s.iconBtn, { marginLeft: 6 }]} onPress={() => remove(p)}><Text style={[s.iconBtnText, { color: C.red }]}>Excluir</Text></TouchableOpacity>
            </View>
          </View>
        );
      })}

      <Btn label={showProfile ? 'Fechar dados da loja' : 'Editar dados da loja'} kind="secondary" onPress={() => setShowProfile(!showProfile)} />
      {showProfile && (
        <View style={s.panel}>
          <Field label="Nome da loja" value={profile.nome_loja} onChange={setP('nome_loja')} autoCapitalize="words" />
          <Field label="WhatsApp" value={profile.telefone} onChange={(v) => setP('telefone')(maskPhone(v))} keyboard="phone-pad" />
          <Text style={[s.label, { marginHorizontal: 20, marginTop: 12 }]}>Categoria principal</Text>
          <Chips items={CATS} value={profile.categoria_loja} onChange={setP('categoria_loja')} icons />
          <Field label="Endereço" value={profile.endereco} onChange={setP('endereco')} />
          <Field label="Bairro" value={profile.bairro} onChange={setP('bairro')} />
          <Field label="Horário" value={profile.horario} onChange={setP('horario')} />
          <Field label="Instagram" value={profile.instagram} onChange={setP('instagram')} autoCapitalize="none" />
          <Btn label="Salvar dados da loja" onPress={saveProfile} />
        </View>
      )}
    </>
  );
}
