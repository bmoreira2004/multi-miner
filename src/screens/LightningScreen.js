import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { initLightning, getLightningBalance, createInvoice, payInvoice } from '../lib/lightningClient';

export default function LightningScreen() {
  const [mnemonic, setMnemonic] = useState('');
  const [connected, setConnected] = useState(false);
  const [balance, setBalance] = useState(null);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [generatedInvoice, setGeneratedInvoice] = useState('');
  const [payBolt11, setPayBolt11] = useState('');
  const [status, setStatus] = useState('');

  const connectWallet = async () => {
    if (!mnemonic || mnemonic.trim().split(' ').length < 12) {
      setStatus('Cole sua seed phrase (12 ou 24 palavras) para conectar.');
      return;
    }
    try {
      setStatus('Conectando ao nó Lightning...');
      await initLightning(mnemonic.trim());
      setConnected(true);
      setStatus('Conectado.');
      refreshBalance();
    } catch (e) {
      setStatus(`Erro ao conectar: ${e.message}. Verifique se a BREEZ_API_KEY foi configurada (ver src/lib/lightningClient.js).`);
    }
  };

  const refreshBalance = useCallback(async () => {
    try {
      const b = await getLightningBalance();
      setBalance(b);
    } catch (e) {
      setStatus(`Erro ao consultar saldo: ${e.message}`);
    }
  }, []);

  const handleCreateInvoice = async () => {
    const sats = parseInt(invoiceAmount, 10);
    if (!sats || sats <= 0) {
      setStatus('Informe um valor em sats.');
      return;
    }
    try {
      const bolt11 = await createInvoice(sats, 'Recebimento Multi Miner');
      setGeneratedInvoice(bolt11);
      setStatus('Invoice gerado.');
    } catch (e) {
      setStatus(`Erro ao gerar invoice: ${e.message}`);
    }
  };

  const handlePay = async () => {
    if (!payBolt11) {
      setStatus('Cole um invoice (bolt11) para pagar.');
      return;
    }
    Alert.alert('Confirmar pagamento', 'Enviar este pagamento Lightning agora?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Enviar',
        style: 'destructive',
        onPress: async () => {
          try {
            await payInvoice(payBolt11.trim());
            setStatus('Pagamento enviado.');
            refreshBalance();
          } catch (e) {
            setStatus(`Erro ao pagar: ${e.message}`);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Lightning ⚡</Text>

      {!connected && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Conectar carteira Lightning</Text>
          <Text style={styles.helperText}>
            Carteira não-custodial real (Breez SDK / Greenlight). Sua seed phrase
            fica só no seu aparelho — nunca é enviada para nenhum servidor nosso.
          </Text>
          <TextInput
            style={[styles.input, { height: 70 }]}
            placeholder="seed phrase (12 ou 24 palavras)"
            placeholderTextColor="#666"
            value={mnemonic}
            onChangeText={setMnemonic}
            multiline
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.button} onPress={connectWallet}>
            <Text style={styles.buttonText}>Conectar</Text>
          </TouchableOpacity>
        </View>
      )}

      {connected && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Saldo</Text>
            {balance ? (
              <>
                <Text style={styles.balanceValue}>{balance.balanceSats.toLocaleString()} sats</Text>
                <Text style={styles.balanceSub}>Recebível até: {balance.maxReceivableSats.toLocaleString()} sats</Text>
                <Text style={styles.balanceSub}>Enviável até: {balance.maxSendableSats.toLocaleString()} sats</Text>
              </>
            ) : (
              <Text style={styles.helperText}>Carregando saldo...</Text>
            )}
            <TouchableOpacity style={styles.linkButton} onPress={refreshBalance}>
              <Text style={styles.linkButtonText}>Atualizar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Receber</Text>
            <TextInput
              style={styles.input}
              placeholder="Valor em sats"
              placeholderTextColor="#666"
              value={invoiceAmount}
              onChangeText={setInvoiceAmount}
              keyboardType="number-pad"
            />
            <TouchableOpacity style={styles.button} onPress={handleCreateInvoice}>
              <Text style={styles.buttonText}>Gerar invoice</Text>
            </TouchableOpacity>
            {!!generatedInvoice && <Text selectable style={styles.invoiceText}>{generatedInvoice}</Text>}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Enviar</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              placeholder="Cole o invoice (bolt11) de destino"
              placeholderTextColor="#666"
              value={payBolt11}
              onChangeText={setPayBolt11}
              multiline
              autoCapitalize="none"
            />
            <TouchableOpacity style={[styles.button, { backgroundColor: '#f7931a' }]} onPress={handlePay}>
              <Text style={styles.buttonText}>Pagar</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {!!status && <Text style={styles.statusText}>{status}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1115' },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 16 },
  card: { backgroundColor: '#1c1f26', borderRadius: 12, padding: 16, marginBottom: 14 },
  cardTitle: { color: '#fff', fontWeight: '700', marginBottom: 8 },
  helperText: { color: '#9aa0a6', fontSize: 12, marginBottom: 8, lineHeight: 18 },
  input: { backgroundColor: '#14161b', color: '#fff', borderRadius: 10, padding: 12, marginTop: 6 },
  button: { marginTop: 12, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#2ecc71' },
  buttonText: { color: '#0f1115', fontWeight: '700', fontSize: 15 },
  linkButton: { marginTop: 10 },
  linkButtonText: { color: '#5ab0ff', fontSize: 13 },
  balanceValue: { color: '#2ecc71', fontSize: 22, fontWeight: '700' },
  balanceSub: { color: '#9aa0a6', fontSize: 12, marginTop: 4 },
  invoiceText: { color: '#5ab0ff', fontSize: 11, marginTop: 10 },
  statusText: { color: '#9aa0a6', fontSize: 12, marginTop: 8, lineHeight: 18 },
});
