import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Text, View } from 'react-native';
import { supabase } from './supabase';
import { s } from './theme';
import { Btn, Field } from './ui';

export default function NewPasswordModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (senha.length < 6) return void Alert.alert('Senha curta', 'A senha precisa ter pelo menos 6 caracteres.');
    if (senha !== confirmar) return void Alert.alert('Senhas diferentes', 'As duas senhas precisam ser iguais.');
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSaving(false);
    if (error) return void Alert.alert('Não foi possível alterar', error.message);
    setSenha(''); setConfirmar('');
    onClose();
    Alert.alert('Senha alterada', 'Sua nova senha já está valendo.');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.shade}>
        <View style={s.modal}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={s.detailTitle}>Criar nova senha</Text>
            <Text style={s.info}>Digite a nova senha da sua conta.</Text>
            <Field label="Nova senha" value={senha} onChange={setSenha} secure placeholder="Mínimo 6 caracteres" />
            <Field label="Confirmar nova senha" value={confirmar} onChange={setConfirmar} secure />
            <Btn label={saving ? 'Salvando...' : 'Salvar nova senha'} onPress={save} disabled={saving} />
            <Btn label="Agora não" kind="secondary" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
