import { useState, useEffect, useRef, useCallback } from 'react';

const COINS = {
  XMR: {
    name: 'Monero',
    color: '#ff6600',
    api: (addr) => `https://supportxmr.com/api/miner/${addr}/stats`,
  },
  WOW: {
    name: 'Wownero',
    color: '#a35ce8',
    api: (addr) => `https://wow.hashvault.pro/api/miner/${addr}/stats`,
  },
};

const AUTO_REFRESH_MS = 30000;

export default function WalletChecker() {
  const [coin, setCoin] = useState('XMR');
  const [address, setAddress] = useState('');
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoRefreshOn, setAutoRefreshOn] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);

  const checkBalance = useCallback(async (silent = false) => {
    if (!address) {
      setStatus('Cole um endereço de carteira.');
      return;
    }
    if (!silent) setLoading(true);
    if (!silent) setStatus('Consultando a pool...');
    try {
      const res = await fetch(COINS[coin].api(address));
      if (!res.ok) throw new Error(`Pool respondeu ${res.status}`);
      const data = await res.json();
      const atomic = 1e12;
      setResult({
        pending: (data.amtDue || 0) / atomic,
        paid: (data.amtPaid || 0) / atomic,
        hashes: data.hashes || 0,
      });
      setLastUpdate(new Date());
      setStatus('');
      setAutoRefreshOn(true);
    } catch (e) {
      setStatus(
        `Não consegui consultar direto do navegador (${e.message}). Isso costuma ser bloqueio de CORS da pool — funciona normalmente no app mobile.`
      );
    } finally {
      if (!silent) setLoading(false);
    }
  }, [address, coin]);

  // Mostrador: depois da primeira consulta bem-sucedida, passa a atualizar
  // sozinho a cada 30s, sem precisar clicar de novo.
  useEffect(() => {
    if (!autoRefreshOn) return;
    intervalRef.current = setInterval(() => checkBalance(true), AUTO_REFRESH_MS);
    return () => clearInterval(intervalRef.current);
  }, [autoRefreshOn, checkBalance]);

  useEffect(() => {
    setAutoRefreshOn(false);
    setResult(null);
    clearInterval(intervalRef.current);
  }, [coin, address]);

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span
          style={{
            width: 26, height: 26, borderRadius: '50%', background: COINS[coin].color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: '#14161b',
          }}
        >
          {coin[0]}
        </span>
        <h3 style={{ margin: 0 }}>Verificar saldo minerado</h3>
      </div>
      <p className="desc">
        Consulta em tempo real, direto na API pública da pool — o mesmo dado que aparece no app mobile.
      </p>
      <div className="row">
        {Object.entries(COINS).map(([symbol, c]) => (
          <button
            key={symbol}
            className="chip"
            data-active={coin === symbol}
            onClick={() => setCoin(symbol)}
          >
            {c.name} ({symbol})
          </button>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <input
          type="text"
          placeholder={`Endereço ${coin}`}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      <div className="row">
        <button className="btn btn-primary" onClick={() => checkBalance(false)} disabled={loading}>
          {loading ? 'Consultando...' : 'Consultar saldo'}
        </button>
      </div>
      {result && (
        <>
          <p className="stat-value">⛏️ {result.pending.toFixed(6)} {coin}</p>
          <p className="stat-sub">
            pendente · {result.paid.toFixed(6)} {coin} já pago · {result.hashes.toLocaleString()} hashes totais
          </p>
          {autoRefreshOn && (
            <p className="stat-sub">
              🔄 Atualizando sozinho a cada 30s
              {lastUpdate ? ` · última leitura ${lastUpdate.toLocaleTimeString()}` : ''}
            </p>
          )}
        </>
      )}
      {status && <p className="status-line">{status}</p>}
    </div>
  );
}
