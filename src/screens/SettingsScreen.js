import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { NATIVE_MINING_AVAILABLE } from '../lib/nativeMiningBridge';

export default function SettingsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Ajustes</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status do motor de mineração</Text>
        <Text style={styles.text}>
          {NATIVE_MINING_AVAILABLE
            ? 'Núcleo nativo RandomX carregado. Mineração real ativa.'
            : 'Núcleo nativo RandomX não compilado neste build (modo stub). Veja src/native/README_NATIVE_MINING.md.'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sem anúncios</Text>
        <Text style={styles.text}>Este app não exibe nenhum tipo de anúncio ou publicidade de terceiros.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Consumo de bateria</Text>
        <Text style={styles.text}>
          Mineração RandomX usa CPU intensivamente. O app para automaticamente
          quando enviado para segundo plano — isso é exigência da Apple (App
          Store 2.4.2) e boa prática também no Android.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Segurança da carteira</Text>
        <Text style={styles.text}>
          As chaves privadas das moedas minadas (XMR/WOW) nunca são armazenadas
          neste app. A seed phrase Lightning fica apenas localmente no
          dispositivo, nunca é enviada a servidores nossos.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1115' },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 16 },
  card: { backgroundColor: '#1c1f26', borderRadius: 12, padding: 16, marginBottom: 14 },
  cardTitle: { color: '#fff', fontWeight: '700', marginBottom: 8 },
  text: { color: '#9aa0a6', fontSize: 13, lineHeight: 19 },
});
