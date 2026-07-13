import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { COINS } from '../lib/pools';
import { fetchMinerBalance } from '../lib/walletApi';

export default function WalletScreen() {
  const [addresses, setAddresses] = useState({ XMR: '', WOW: '' });
  const [balances, setBalances] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferCoin, setTransferCoin] = useState('XMR');
  const [transferStatus, setTransferStatus] = useState('');

  const loadBalances = useCallback(async () => {
    setRefreshing(true);
    const next = {};
    for (const symbol of Object.keys(COINS)) {
      const addr = addresses[symbol];
      if (!addr) continue;
      try {
        next[symbol] = await fetchMinerBalance(symbol, addr);
      } catch (e) {
        next[symbol] = { error: e.message };
      }
    }
    setBalances(next);
    setRefreshing(false);
  }, [addresses]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  const handleTransfer = () => {
    if (!transferTo || !transferAmount) {
      setTransferStatus('Preencha destino e valor.');
      return;
    }
    // Transferência real de moedas minadas (XMR/WOW) requer assinatura da
    // transação com a chave privada da carteira — isso deve ser feito por
    // uma carteira dedicada (Monero.com, Cake Wallet, Feather) ou por uma
    // lib como monero-javascript integrada com sua wallet keys, nunca aqui
    // de forma custodiada. Este app foca em minerar + visualizar; o envio
    // on-chain é delegado à carteira externa do usuário, por segurança.
    setTransferStatus(
      'Para enviar XMR/WOW minerados, abra sua carteira externa (Cake Wallet, Feather, Monero GUI) — este app não guarda sua chave privada, por segurança.'
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadBalances} tintColor="#fff" />}
    >
      <Text style={styles.title}>Carteira</Text>

      {Object.values(COINS).map((coin) => (
        <View key={coin.symbol} style={styles.card}>
          <Text style={styles.cardTitle}>{coin.name} ({coin.symbol})</Text>
          <TextInput
            style={styles.input}
            placeholder={`Endereço ${coin.symbol} usado na mineração`}
            placeholderTextColor="#666"
            value={addresses[coin.symbol]}
            onChangeText={(v) => setAddresses((a) => ({ ...a, [coin.symbol]: v }))}
            autoCapitalize="none"
          />
          {balances[coin.symbol] && !balances[coin.symbol].error && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.balanceValue}>
                {balances[coin.symbol].pending.toFixed(6)} {coin.symbol} pendente
              </Text>
              <Text style={styles.balanceSub}>
                {balances[coin.symbol].paidTotal.toFixed(6)} {coin.symbol} já pago pela pool
              </Text>
            </View>
          )}
          {balances[coin.symbol]?.error && (
            <Text style={styles.errorText}>{balances[coin.symbol].error}</Text>
          )}
        </View>
      ))}

      <Text style={[styles.title, { fontSize: 20, marginTop: 24 }]}>Enviar para outra carteira</Text>
      <View style={styles.row}>
        {Object.values(COINS).map((c) => (
          <TouchableOpacity
            key={c.symbol}
            style={[styles.chip, transferCoin === c.symbol && styles.chipActive]}
            onPress={() => setTransferCoin(c.symbol)}
          >
            <Text style={transferCoin === c.symbol ? styles.chipTextActive : styles.chipText}>{c.symbol}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Endereço de destino"
        placeholderTextColor="#666"
        value={transferTo}
        onChangeText={setTransferTo}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder={`Valor em ${transferCoin}`}
        placeholderTextColor="#666"
        value={transferAmount}
        onChangeText={setTransferAmount}
        keyboardType="decimal-pad"
      />
      <TouchableOpacity style={styles.button} onPress={handleTransfer}>
        <Text style={styles.buttonText}>Enviar</Text>
      </TouchableOpacity>
      {!!transferStatus && <Text style={styles.infoText}>{transferStatus}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1115' },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 16 },
  card: { backgroundColor: '#1c1f26', borderRadius: 12, padding: 16, marginBottom: 14 },
  cardTitle: { color: '#fff', fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: '#14161b', color: '#fff', borderRadius: 10, padding: 12, marginTop: 6 },
  balanceValue: { color: '#2ecc71', fontSize: 18, fontWeight: '700' },
  balanceSub: { color: '#9aa0a6', fontSize: 12, marginTop: 2 },
  errorText: { color: '#e74c3c', fontSize: 12, marginTop: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#1c1f26', marginRight: 8 },
  chipActive: { backgroundColor: '#f7931a' },
  chipText: { color: '#ccc' },
  chipTextActive: { color: '#0f1115', fontWeight: '700' },
  button: { marginTop: 14, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#2ecc71' },
  buttonText: { color: '#0f1115', fontWeight: '700', fontSize: 16 },
  infoText: { color: '#9aa0a6', marginTop: 12, fontSize: 12, lineHeight: 18 },
});
