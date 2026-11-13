import React from 'react';
import { Image, Linking, Modal, ScrollView, Text, View } from 'react-native';
import { C, s } from './theme';
import { Btn, Icon } from './ui';
import { Promo } from './types';
import { CAT_ICONS, discount, IconName, isoToBr, mapsUrl, money, storeOf, whatsappUrl } from './utils';

type Props = { promo: Promo | null; favorite: boolean; onFav: () => void; onShare: () => void; onClose: () => void; onReport?: () => void };

function Info({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <View style={s.infoRow}>
      <Icon name={icon} size={16} color={C.muted} />
      <Text style={s.infoText}>{children}</Text>
    </View>
  );
}

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
                : <View style={[s.photo, s.detailImage, { width: 'auto' }]}><Icon name={CAT_ICONS[p.categoria ?? ''] ?? 'pricetag-outline'} size={60} color="#8795aa" /></View>}
              <Text style={[s.shopName, { marginHorizontal: 20, marginTop: 12 }]}>{l?.nome_loja || 'Comércio local'}</Text>
              <Text style={s.detailTitle}>{p.titulo}</Text>
              {!!p.descricao && <Text style={s.info}>{p.descricao}</Text>}
              <Text style={s.detailPrice}>
                {money(p.preco)}{' '}
                {Number(p.preco_original) > Number(p.preco) && <Text style={s.oldPrice}>{money(p.preco_original)}  ·  {off}% OFF</Text>}
              </Text>
              {!!p.validade && <Info icon="calendar-outline">Válida até {isoToBr(p.validade)}</Info>}
              {!!l?.endereco && <Info icon="location-outline">{l.endereco}{l.bairro ? ` – ${l.bairro}` : ''}</Info>}
              {!!l?.horario && <Info icon="time-outline">{l.horario}</Info>}
              {!!zap && <Btn label="Chamar no WhatsApp" kind="whatsapp" icon="logo-whatsapp" onPress={() => open(zap)} />}
              {!!mapa && <Btn label="Como chegar" kind="secondary" icon="navigate-outline" onPress={() => open(mapa)} />}
              {!!l?.instagram && <Btn label={`Instagram @${l.instagram}`} kind="secondary" icon="logo-instagram" onPress={() => open(`https://instagram.com/${l.instagram}`)} />}
              <Btn label="Compartilhar oferta" kind="secondary" icon="share-social-outline" onPress={onShare} />
              <Btn label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} kind="secondary" icon={favorite ? 'heart' : 'heart-outline'} onPress={onFav} />
              {onReport && <Btn label="Denunciar oferta" kind="secondary" icon="flag-outline" onPress={onReport} />}
              <Btn label="Fechar" kind="secondary" onPress={onClose} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
