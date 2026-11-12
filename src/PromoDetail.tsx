import React from 'react';
import { Image, Linking, Modal, ScrollView, Text, View } from 'react-native';
import { s } from './theme';
import { Btn } from './ui';
import { Promo } from './types';
import { CAT_ICONS, discount, isoToBr, mapsUrl, money, storeOf, whatsappUrl } from './utils';

type Props = { promo: Promo | null; favorite: boolean; onFav: () => void; onShare: () => void; onClose: () => void; onReport?: () => void };

export default function PromoDetail({ promo: p, favorite, onFav, onShare, onClose, onReport }: Props) {
  const l = storeOf(p?.lojas);
  const zap = whatsappUrl(l?.telefone, p ? `Olá! Vi a promoção "${p.titulo}" no Tijuco Promoções.` : '');
  const mapa = mapsUrl(l);
  const off = p ? discount(p) : 0;
  const open = (url: string) => Linking.openURL(url).catch(() => undefined);

  return (
    <Modal visible={!!p} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.shade}>
        <View style={s.modal}>
          {p && (
            <ScrollView>
              {p.imagem_url
                ? <Image source={{ uri: p.imagem_url }} style={s.detailImage} />
                : <View style={[s.detailImage, s.photo]}><Text style={{ fontSize: 64 }}>{CAT_ICONS[p.categoria ?? ''] ?? '🛍️'}</Text></View>}
              <Text style={[s.shopName, { marginHorizontal: 20, marginTop: 12 }]}>{l?.nome_loja || 'Comércio local'}</Text>
              <Text style={s.detailTitle}>{p.titulo}</Text>
              {!!p.descricao && <Text style={s.info}>{p.descricao}</Text>}
              <Text style={s.detailPrice}>
                {money(p.preco)}{' '}
                {Number(p.preco_original) > Number(p.preco) && <Text style={s.oldPrice}>{money(p.preco_original)}  ·  {off}% OFF</Text>}
              </Text>
              {!!p.validade && <Text style={s.info}>📅 Válida até {isoToBr(p.validade)}</Text>}
              {!!l?.endereco && <Text style={s.info}>📍 {l.endereco}{l.bairro ? ` – ${l.bairro}` : ''}</Text>}
              {!!l?.horario && <Text style={s.info}>🕒 {l.horario}</Text>}
              {!!zap && <Btn label="Chamar no WhatsApp" onPress={() => open(zap)} />}
              {!!mapa && <Btn label="Como chegar" kind="secondary" onPress={() => open(mapa)} />}
              {!!l?.instagram && <Btn label={`Instagram @${l.instagram}`} kind="secondary" onPress={() => open(`https://instagram.com/${l.instagram}`)} />}
              <Btn label="↗ Compartilhar oferta" kind="secondary" onPress={onShare} />
              <Btn label={favorite ? '♥ Remover dos favoritos' : '♡ Adicionar aos favoritos'} kind="secondary" onPress={onFav} />
              {onReport && <Btn label="🚩 Denunciar oferta" kind="secondary" onPress={onReport} />}
              <Btn label="Fechar" kind="secondary" onPress={onClose} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
