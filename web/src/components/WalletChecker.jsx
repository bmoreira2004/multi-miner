import { useState } from 'react';

const COINS = {
  XMR: {
    name: 'Monero',
    api: (addr) => `https://supportxmr.com/api/miner/${addr}/stats`,
  },
  WOW: {
    name: 'Wownero',
    api: (addr) => `https://wow.hashvault.pro/api/miner/${addr}/stats`,
  },
};

export default function WalletChecker() {
  const [coin, setCoin] = useState('XMR');
  const [address, setAddress] = useState('');
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const checkBalance = async () => {
    if (!address) {
      setStatus('Cole um endereço de carteira.');
      return;
    }
    setLoading(true);
    setStatus('Consultando a pool...');
    setResult(null);
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
      setStatus('');
    } catch (e) {
      setStatus(
        `Não consegui consultar direto do navegador (${e.message}). Isso costuma ser bloqueio de CORS da pool — funciona normalmente no app mobile.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3>Verificar saldo minerado</h3>
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
        <button className="btn btn-primary" onClick={checkBalance} disabled={loading}>
          {loading ? 'Consultando...' : 'Consultar saldo'}
        </button>
      </div>
      {result && (
        <>
          <p className="stat-value">{result.pending.toFixed(6)} {coin}</p>
          <p className="stat-sub">pendente · {result.paid.toFixed(6)} {coin} já pago · {result.hashes.toLocaleString()} hashes totais</p>
        </>
      )}
      {status && <p className="status-line">{status}</p>}
    </div>
  );
}
