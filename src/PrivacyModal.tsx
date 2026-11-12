import React from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { s } from './theme';
import { Btn } from './ui';
import { ATUALIZADA_EM, POLITICA } from './privacy';

export default function PrivacyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.shade}>
        <View style={s.modal}>
          <ScrollView>
            <Text style={s.detailTitle}>Política de Privacidade</Text>
            <Text style={s.muted}>  Atualizada em {ATUALIZADA_EM}</Text>
            {POLITICA.map((sec) => (
              <View key={sec.titulo}>
                <Text style={s.policyH}>{sec.titulo}</Text>
                <Text style={s.policyP}>{sec.texto}</Text>
              </View>
            ))}
            <Btn label="Entendi" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
