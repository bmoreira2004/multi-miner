import { useState, useRef, useCallback } from 'react';

export default function MiningBenchmark() {
  const [running, setRunning] = useState(false);
  const [hashrate, setHashrate] = useState(0);
  const [totalHashes, setTotalHashes] = useState(0);
  const [status, setStatus] = useState('Parado.');
  const stopFlag = useRef(false);

  const start = useCallback(async () => {
    setStatus('Carregando WASM do RandomX...');
    setRunning(true);
    stopFlag.current = false;

    // randomx.js: implementação real do RandomX (algoritmo de PoW do Monero)
    // compilada para WebAssembly. Calcula hashes de verdade, seguindo a
    // especificação exata do algoritmo — só que em JS/WASM é bem mais lento
    // que o núcleo nativo C++ usado no app mobile.
    const { randomx_init_cache, randomx_create_vm } = await import('randomx.js');

    const cache = randomx_init_cache('multi-miner-web-benchmark-key');
    const vm = randomx_create_vm(cache);

    setStatus('Hashing em andamento (thread única, JS/WASM)...');

    let count = 0;
    let windowCount = 0;
    let windowStart = performance.now();

    const loop = () => {
      if (stopFlag.current) {
        setStatus('Parado.');
        setHashrate(0);
        return;
      }
      // Faz um lote pequeno por frame pra não travar a UI do navegador.
      for (let i = 0; i < 4; i++) {
        vm.calculate_hash(`multi-miner-benchmark-${count}`);
        count++;
        windowCount++;
      }
      setTotalHashes(count);

      const elapsed = performance.now() - windowStart;
      if (elapsed > 1000) {
        setHashrate(windowCount / (elapsed / 1000));
        windowCount = 0;
        windowStart = performance.now();
      }
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }, []);

  const stop = useCallback(() => {
    stopFlag.current = true;
    setRunning(false);
  }, []);

  return (
    <div className="card">
      <h3>Benchmark real de RandomX (navegador)</h3>
      <p className="desc">
        Calcula hashes RandomX de verdade no seu CPU via WebAssembly — o mesmo
        algoritmo do Monero. Isto é um benchmark, não está conectado a
        nenhuma pool: navegador não faz conexão TCP direta com o protocolo
        Stratum, então não gera moeda de verdade aqui (isso é feito pelo
        núcleo nativo do app mobile). Serve para você medir o hashrate real
        do seu CPU rodando RandomX.
      </p>
      <div className="row">
        {!running ? (
          <button className="btn btn-primary" onClick={start}>Iniciar benchmark</button>
        ) : (
          <button className="btn" onClick={stop}>Parar</button>
        )}
      </div>
      <p className="stat-value">{hashrate.toFixed(1)} H/s</p>
      <p className="stat-sub">{totalHashes.toLocaleString()} hashes calculados nesta sessão</p>
      <div className="hashrate-bar">
        <div className="hashrate-fill" style={{ width: `${Math.min(100, hashrate * 2)}%` }} />
      </div>
      <p className="status-line">{status}</p>
    </div>
  );
}
