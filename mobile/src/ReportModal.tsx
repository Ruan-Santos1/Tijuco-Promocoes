import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Text, View } from 'react-native';
import { supabase } from './supabase';
import { s } from './theme';
import { Btn, Chips, Field } from './ui';
import { Promo } from './types';

const MOTIVOS = ['Preço enganoso', 'Oferta falsa ou golpe', 'Produto proibido', 'Conteúdo ofensivo', 'Foto ou texto copiado', 'Outro'];

export default function ReportModal({ promo, userId, onClose }: { promo: Promo | null; userId?: string; onClose: () => void }) {
  const [motivo, setMotivo] = useState('');
  const [detalhe, setDetalhe] = useState('');
  const [sending, setSending] = useState(false);

  const close = () => { setMotivo(''); setDetalhe(''); onClose(); };

  const send = async () => {
    if (!promo || !userId) return;
    if (!motivo) return void Alert.alert('Escolha um motivo', 'Selecione o que há de errado com a oferta.');
    setSending(true);
    const { error } = await supabase.from('denuncias').insert({
      promocao_id: promo.id, loja_id: promo.loja_id, denunciante_id: userId, motivo, detalhe: detalhe.trim() || null,
    });
    setSending(false);
    if (error) {
      return void Alert.alert(
        error.code === '23505' ? 'Denúncia já enviada' : 'Não foi possível enviar',
        error.code === '23505' ? 'Você já denunciou esta oferta. Vamos analisar.' : error.message,
      );
    }
    close();
    Alert.alert('Denúncia enviada', 'Obrigado por ajudar. Vamos analisar a oferta.');
  };

  return (
    <Modal visible={!!promo} transparent animationType="slide" onRequestClose={close}>
      <View style={s.shade}>
        <View style={s.modal}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={s.detailTitle}>Denunciar oferta</Text>
            <Text style={s.info}>{promo?.titulo}</Text>
            <Text style={[s.label, { marginHorizontal: 20, marginTop: 14 }]}>Qual é o problema?</Text>
            <Chips items={MOTIVOS} value={motivo} onChange={setMotivo} />
            <Field label="Detalhes (opcional)" value={detalhe} onChange={setDetalhe} multiline maxLength={300} hint={`${detalhe.length}/300`} />
            <Btn label={sending ? 'Enviando...' : 'Enviar denúncia'} onPress={send} disabled={sending} />
            <Btn label="Cancelar" kind="secondary" onPress={close} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
