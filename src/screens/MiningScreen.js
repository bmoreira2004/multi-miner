import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, AppState } from 'react-native';
import { COINS, getPoolsForCoin } from '../lib/pools';
import { StratumClient } from '../lib/stratumClient';
import { startNativeMining, stopNativeMining, subscribeToHashrate, subscribeToShareFound, NATIVE_MINING_AVAILABLE } from '../lib/nativeMiningBridge';

export default function MiningScreen() {
  const [coinSymbol, setCoinSymbol] = useState('XMR');
  const [poolId, setPoolId] = useState(getPoolsForCoin('XMR')[0].id);
  const [walletAddress, setWalletAddress] = useState('');
  const [status, setStatus] = useState('Parado');
  const [hashrate, setHashrate] = useState(0);
  const [shares, setShares] = useState({ accepted: 0, rejected: 0 });
  const [currentJob, setCurrentJob] = useState(null);
  const [mining, setMining] = useState(false);

  const clientRef = useRef(null);

  const pools = getPoolsForCoin(coinSymbol);
  const pool = pools.find((p) => p.id === poolId) || pools[0];

  // Política de loja: mineração só em foreground. Para automaticamente
  // se o app for para background (exigência da App Store 2.4.2, e boa
  // prática também no Android).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active' && mining) {
        stopMining();
        setStatus('Pausado (app em segundo plano)');
      }
    });
    return () => sub.remove();
  }, [mining]);

  const startMining = useCallback(async () => {
    if (!walletAddress) {
      setStatus('Informe o endereço da sua carteira antes de iniciar.');
      return;
    }
    setStatus('Iniciando...');
    const coin = COINS[coinSymbol];

    const client = new StratumClient({
      host: pool.host,
      port: pool.port,
      walletAddress,
      workerName: 'mobile',
      algo: coin.algo,
      onStatus: setStatus,
      onJob: async (job) => {
        setCurrentJob(job);
        const result = await startNativeMining({ seedHex: job.seed_hash, algo: coin.algo, threads: 2 });
        if (result.mode === 'stub') {
          setStatus(`Job recebido, mas ${result.reason}`);
        }
      },
      onShareResult: (accepted) => {
        setShares((s) => (accepted ? { ...s, accepted: s.accepted + 1 } : { ...s, rejected: s.rejected + 1 }));
      },
    });

    clientRef.current = client;
    client.connect();
    setMining(true);

    subscribeToHashrate((hr) => setHashrate(hr));
    subscribeToShareFound(({ jobId, nonce, result }) => {
      clientRef.current?.submitShare(jobId, nonce, result);
    });
  }, [coinSymbol, pool, walletAddress]);

  const stopMining = useCallback(async () => {
    await stopNativeMining();
    clientRef.current?.disconnect();
    clientRef.current = null;
    setMining(false);
    setHashrate(0);
    setStatus('Parado');
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Mineração</Text>

      {!NATIVE_MINING_AVAILABLE && (
        <View style={styles.warnBox}>
          <Text style={styles.warnText}>
            Núcleo nativo RandomX ainda não compilado neste build (modo stub).
            Veja src/native/README_NATIVE_MINING.md para compilar o real.
          </Text>
        </View>
      )}

      <Text style={styles.label}>Moeda</Text>
      <View style={styles.row}>
        {Object.values(COINS).map((c) => (
          <TouchableOpacity
            key={c.symbol}
            style={[styles.chip, coinSymbol === c.symbol && styles.chipActive]}
            onPress={() => {
              setCoinSymbol(c.symbol);
              setPoolId(getPoolsForCoin(c.symbol)[0].id);
            }}
          >
            <Text style={coinSymbol === c.symbol ? styles.chipTextActive : styles.chipText}>
              {c.name} ({c.symbol})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Pool</Text>
      <View style={styles.row}>
        {pools.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.chip, poolId === p.id && styles.chipActive]}
            onPress={() => setPoolId(p.id)}
          >
            <Text style={poolId === p.id ? styles.chipTextActive : styles.chipText}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Endereço da sua carteira ({coinSymbol})</Text>
      <TextInput
        style={styles.input}
        placeholder={`Cole seu endereço ${coinSymbol} aqui`}
        placeholderTextColor="#666"
        value={walletAddress}
        onChangeText={setWalletAddress}
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.button, mining ? styles.buttonStop : styles.buttonStart]}
        onPress={mining ? stopMining : startMining}
      >
        <Text style={styles.buttonText}>{mining ? 'Parar mineração' : 'Iniciar mineração'}</Text>
      </TouchableOpacity>

      <View style={styles.statsBox}>
        <Text style={styles.statLine}>Status: {status}</Text>
        <Text style={styles.statLine}>Hashrate: {hashrate.toFixed(1)} H/s</Text>
        <Text style={styles.statLine}>Shares aceitos: {shares.accepted}</Text>
        <Text style={styles.statLine}>Shares rejeitados: {shares.rejected}</Text>
        <Text style={styles.statLine}>Job atual: {currentJob ? currentJob.job_id : '—'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1115' },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 16 },
  label: { color: '#9aa0a6', marginTop: 12, marginBottom: 6, fontSize: 13 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#1c1f26', marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#f7931a' },
  chipText: { color: '#ccc' },
  chipTextActive: { color: '#0f1115', fontWeight: '700' },
  input: { backgroundColor: '#1c1f26', color: '#fff', borderRadius: 10, padding: 12, marginTop: 4 },
  button: { marginTop: 20, padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonStart: { backgroundColor: '#2ecc71' },
  buttonStop: { backgroundColor: '#e74c3c' },
  buttonText: { color: '#0f1115', fontWeight: '700', fontSize: 16 },
  statsBox: { marginTop: 24, backgroundColor: '#1c1f26', borderRadius: 12, padding: 16 },
  statLine: { color: '#ddd', marginBottom: 6 },
  warnBox: { backgroundColor: '#3a2b0f', borderRadius: 10, padding: 12, marginBottom: 16 },
  warnText: { color: '#ffcf80', fontSize: 13 },
});
