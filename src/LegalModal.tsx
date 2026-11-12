import React from 'react';
import { Linking, Modal, ScrollView, Text, View } from 'react-native';
import { s } from './theme';
import { Btn } from './ui';
import { ATUALIZADA_EM, POLITICA, POLITICA_URL, TERMOS_URL } from './privacy';
import { TERMOS } from './terms';

export type Doc = 'privacidade' | 'termos';

export default function LegalModal({ doc, onClose }: { doc: Doc | null; onClose: () => void }) {
  const d = doc === 'termos'
    ? { titulo: 'Termos de Uso', secoes: TERMOS, url: TERMOS_URL }
    : { titulo: 'Política de Privacidade', secoes: POLITICA, url: POLITICA_URL };

  return (
    <Modal visible={!!doc} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.shade}>
        <View style={s.modal}>
          <ScrollView>
            <Text style={s.detailTitle}>{d.titulo}</Text>
            <Text style={[s.muted, { marginHorizontal: 20 }]}>Atualizada em {ATUALIZADA_EM}</Text>
            {d.secoes.map((sec) => (
              <View key={sec.titulo}>
                <Text style={s.policyH}>{sec.titulo}</Text>
                <Text style={s.policyP}>{sec.texto}</Text>
              </View>
            ))}
            {!!d.url && <Btn label="Abrir versão online" kind="secondary" onPress={() => Linking.openURL(d.url).catch(() => undefined)} />}
            <Btn label="Entendi" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
