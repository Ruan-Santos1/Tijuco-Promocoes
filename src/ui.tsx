import React from 'react';
import { Image, KeyboardTypeOptions, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { C, s } from './theme';
import { Promo } from './types';
import { CAT_ICONS, daysLeft, discount, money, storeOf } from './utils';

type FieldProps = {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean;
  keyboard?: KeyboardTypeOptions; maxLength?: number; secure?: boolean; hint?: string; autoCapitalize?: 'none' | 'sentences' | 'words';
};

export function Field({ label, value, onChange, placeholder, multiline, keyboard, maxLength, secure, hint, autoCapitalize }: FieldProps) {
  return (
    <View style={s.field}>
      {!!label && <Text style={s.label}>{label}</Text>}
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder ?? label} placeholderTextColor="#8b958d"
        style={[s.input, multiline && s.multiline]} multiline={multiline} keyboardType={keyboard} maxLength={maxLength}
        secureTextEntry={secure} autoCapitalize={autoCapitalize ?? (secure || keyboard === 'email-address' ? 'none' : 'sentences')}
        autoCorrect={false}
      />
      {!!hint && <Text style={s.hint}>{hint}</Text>}
    </View>
  );
}

export function Btn({ label, onPress, kind = 'primary', disabled }: { label: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'danger'; disabled?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} accessibilityRole="button"
      style={[s.button, kind === 'secondary' && s.secondary, kind === 'danger' && s.danger, disabled && s.disabled]}>
      <Text style={[s.buttonText, kind === 'secondary' && s.secondaryText, kind === 'danger' && s.dangerText]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Chips({ items, value, onChange, icons }: { items: string[]; value: string; onChange: (v: string) => void; icons?: boolean }) {
  return (
    <View style={s.chips}>
      {items.map((c) => (
        <TouchableOpacity key={c} onPress={() => onChange(c)} style={[s.chip, value === c && s.chipOn]} accessibilityRole="button">
          <Text style={[s.chipText, value === c && s.chipTextOn]}>{icons ? `${CAT_ICONS[c] ?? ''} ` : ''}{c}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function Segment({ items, value, onChange }: { items: { id: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={s.segment}>
      {items.map((i) => (
        <TouchableOpacity key={i.id} onPress={() => onChange(i.id)} style={[s.segBtn, value === i.id && s.segOn]}>
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
        {checked && <Text style={{ color: C.white, fontWeight: '800' }}>✓</Text>}
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
          {p.imagem_url ? <Image source={{ uri: p.imagem_url }} style={s.image} /> : <Text style={{ fontSize: 40 }}>{CAT_ICONS[p.categoria ?? ''] ?? '🛍️'}</Text>}
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
          {d !== null && d <= 3 && d >= 0 && <Text style={s.urgent}>{d === 0 ? '⏰ Último dia!' : `⏰ Termina em ${d} dia${d > 1 ? 's' : ''}`}</Text>}
          {!!l?.bairro && <Text style={s.muted}>📍 {l.bairro}</Text>}
        </View>
      </View>
      {(onFav || onShare) && (
        <View style={s.cardActions}>
          {onShare && <TouchableOpacity style={s.iconBtn} onPress={onShare} accessibilityLabel="Compartilhar"><Text style={s.iconBtnText}>↗ Compartilhar</Text></TouchableOpacity>}
          {onFav && <TouchableOpacity style={s.iconBtn} onPress={onFav} accessibilityLabel="Favoritar"><Text style={[s.iconBtnText, favorite && { color: '#e33b52' }]}>{favorite ? '♥ Salvo' : '♡ Favoritar'}</Text></TouchableOpacity>}
        </View>
      )}
      {footer}
    </TouchableOpacity>
  );
}
