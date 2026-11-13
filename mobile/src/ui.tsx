import React from 'react';
import { Image, KeyboardTypeOptions, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, s } from './theme';
import { Promo } from './types';
import { CAT_ICONS, daysLeft, discount, IconName, money, storeOf } from './utils';

/** Ícone padrão do app (família Ionicons). */
export function Icon({ name, size = 16, color = C.muted }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

type FieldProps = {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean;
  keyboard?: KeyboardTypeOptions; maxLength?: number; secure?: boolean; hint?: string; autoCapitalize?: 'none' | 'sentences' | 'words';
};

export function Field({ label, value, onChange, placeholder, multiline, keyboard, maxLength, secure, hint, autoCapitalize }: FieldProps) {
  return (
    <View style={s.field}>
      {!!label && <Text style={s.label}>{label}</Text>}
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder ?? label} placeholderTextColor="#8b96a7"
        style={[s.input, multiline && s.multiline]} multiline={multiline} keyboardType={keyboard} maxLength={maxLength}
        secureTextEntry={secure} autoCapitalize={autoCapitalize ?? (secure || keyboard === 'email-address' ? 'none' : 'sentences')}
        autoCorrect={false}
      />
      {!!hint && <Text style={s.hint}>{hint}</Text>}
    </View>
  );
}

type BtnKind = 'primary' | 'secondary' | 'danger' | 'whatsapp';
const BTN_TEXT: Record<BtnKind, string> = { primary: C.white, secondary: C.navy, danger: C.red, whatsapp: C.white };

export function Btn({ label, onPress, kind = 'primary', disabled, icon }: { label: string; onPress: () => void; kind?: BtnKind; disabled?: boolean; icon?: IconName }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} accessibilityRole="button"
      style={[s.button, kind === 'secondary' && s.secondary, kind === 'danger' && s.danger, kind === 'whatsapp' && s.whatsapp, disabled && s.disabled]}>
      {icon && <Icon name={icon} size={17} color={BTN_TEXT[kind]} />}
      <Text style={[s.buttonText, { color: BTN_TEXT[kind] }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Chips({ items, value, onChange, icons }: { items: string[]; value: string; onChange: (v: string) => void; icons?: boolean }) {
  return (
    <View style={s.chips}>
      {items.map((c) => (
        <TouchableOpacity key={c} onPress={() => onChange(c)} style={[s.chip, value === c && s.chipOn]} accessibilityRole="button" accessibilityState={{ selected: value === c }}>
          {icons && !!CAT_ICONS[c] && <Icon name={CAT_ICONS[c]} size={14} color={value === c ? C.white : C.navyMid} />}
          <Text style={[s.chipText, value === c && s.chipTextOn]}>{c}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function Segment({ items, value, onChange }: { items: { id: string; label: string; icon?: IconName }[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={s.segment}>
      {items.map((i) => (
        <TouchableOpacity key={i.id} onPress={() => onChange(i.id)} style={[s.segBtn, value === i.id && s.segOn]} accessibilityRole="button" accessibilityState={{ selected: value === i.id }}>
          {i.icon && <Icon name={i.icon} size={15} color={value === i.id ? C.white : C.text} />}
          <Text style={[s.segText, value === i.id && s.segTextOn]}>{i.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function Check({ checked, onToggle, children }: { checked: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <View style={s.check}>
      <TouchableOpacity onPress={onToggle} style={[s.box, checked && s.boxOn]} accessibilityRole="checkbox" accessibilityState={{ checked }}>
        {checked && <Icon name="checkmark" size={15} color={C.white} />}
      </TouchableOpacity>
      <Text style={s.checkText}>{children}</Text>
    </View>
  );
}

type CardProps = {
  p: Promo; favorite?: boolean; onPress?: () => void; onFav?: () => void; onShare?: () => void; footer?: React.ReactNode;
};

export function PromoCard({ p, favorite, onPress, onFav, onShare, footer }: CardProps) {
  const off = discount(p);
  const d = daysLeft(p.validade);
  const l = storeOf(p.lojas);
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.92} disabled={!onPress}>
      <View style={s.cardRow}>
        <View style={s.photo}>
          {p.imagem_url ? <Image source={{ uri: p.imagem_url }} style={s.image} /> : <Icon name={CAT_ICONS[p.categoria ?? ''] ?? 'pricetag-outline'} size={36} color="#8795aa" />}
          {off > 0 && <Text style={s.discount}>{off}% OFF</Text>}
        </View>
        <View style={s.cardBody}>
          <Text style={s.shopName}>{l?.nome_loja || 'Comércio local'}</Text>
          <Text style={s.product} numberOfLines={2}>{p.titulo || 'Título da oferta'}</Text>
          {!!p.descricao && <Text style={s.description} numberOfLines={2}>{p.descricao}</Text>}
          <View style={s.priceRow}>
            <Text style={s.price}>{money(p.preco)}</Text>
            {Number(p.preco_original) > Number(p.preco) && <Text style={s.oldPrice}>{money(p.preco_original)}</Text>}
          </View>
          {d !== null && d <= 3 && d >= 0 && (
            <View style={s.metaRow}>
              <Icon name="alarm-outline" size={13} color={C.red} />
              <Text style={s.urgent}>{d === 0 ? 'Último dia!' : `Termina em ${d} dia${d > 1 ? 's' : ''}`}</Text>
            </View>
          )}
          {!!l?.bairro && (
            <View style={s.metaRow}>
              <Icon name="location-outline" size={13} />
              <Text style={s.metaText}>{l.bairro}</Text>
            </View>
          )}
        </View>
      </View>
      {(onFav || onShare) && (
        <View style={s.cardActions}>
          {onShare && (
            <TouchableOpacity style={s.iconBtn} onPress={onShare} accessibilityLabel="Compartilhar">
              <Icon name="share-social-outline" size={14} color={C.navy} />
              <Text style={s.iconBtnText}>Compartilhar</Text>
            </TouchableOpacity>
          )}
          {onFav && (
            <TouchableOpacity style={s.iconBtn} onPress={onFav} accessibilityLabel={favorite ? 'Remover dos favoritos' : 'Favoritar'}>
              <Icon name={favorite ? 'heart' : 'heart-outline'} size={14} color={favorite ? C.red : C.navy} />
              <Text style={[s.iconBtnText, favorite && { color: C.red }]}>{favorite ? 'Salvo' : 'Favoritar'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {footer}
    </TouchableOpacity>
  );
}
