import { useState } from 'react';
import { isLightningAddress, resolveToBolt11 } from '../lib/lnurl';

export default function LightningWebLN() {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('');
  const [payTarget, setPayTarget] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [info, setInfo] = useState(null);

  const hasWebLN = typeof window !== 'undefined' && !!window.webln;

  const connect = async () => {
    if (!hasWebLN) {
      setStatus('Nenhuma carteira WebLN encontrada. Instale a extensão Alby (getalby.com) e recarregue a página.');
      return;
    }
    try {
      await window.webln.enable();
      const i = await window.webln.getInfo().catch(() => null);
      setInfo(i);
      setConnected(true);
      setStatus('Conectado.');
    } catch (e) {
      setStatus(`Erro ao conectar: ${e.message}`);
    }
  };

  const pay = async () => {
    if (!payTarget) {
      setStatus('Cole um invoice (bolt11) ou um endereço Lightning primeiro.');
      return;
    }
    try {
      const bolt11 = await resolveToBolt11(payTarget, parseInt(payAmount, 10));
      const result = await window.webln.sendPayment(bolt11);
      setStatus(`Pagamento enviado. Preimage: ${result.preimage?.slice(0, 16)}...`);
    } catch (e) {
      setStatus(`Erro ao pagar: ${e.message}`);
    }
  };

  return (
    <div className="card">
      <h3>Lightning ⚡ (WebLN)</h3>
      <p className="desc">
        Pagamentos Lightning reais no navegador via padrão WebLN — funciona
        com extensões como a Alby. Nenhuma chave fica com este site: a
        assinatura acontece dentro da sua extensão.
      </p>
      {!connected ? (
        <div className="row">
          <button className="btn btn-primary" onClick={connect}>Conectar carteira</button>
        </div>
      ) : (
        <>
          {info?.node?.alias && <p className="stat-sub">Conectado: {info.node.alias}</p>}
          <p className="desc" style={{ marginTop: 10 }}>
            Aceita invoice (lnbc...) ou endereço Lightning, tipo <strong>nomedaconta@walletofsatoshi.com</strong>.
          </p>
          <div style={{ marginTop: 6 }}>
            <input
              type="text"
              placeholder="Invoice (lnbc...) ou nome@walletofsatoshi.com"
              value={payTarget}
              onChange={(e) => setPayTarget(e.target.value)}
            />
          </div>
          {isLightningAddress(payTarget) && (
            <div style={{ marginTop: 8 }}>
              <input
                type="number"
                placeholder="Valor em sats"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </div>
          )}
          <div className="row">
            <button className="btn btn-primary" onClick={pay}>Pagar</button>
          </div>
        </>
      )}
      {!hasWebLN && (
        <p className="status-line">
          Sem extensão WebLN detectada agora — instale{' '}
          <a href="https://getalby.com" target="_blank" rel="noreferrer" style={{ color: 'var(--amber)' }}>Alby</a>{' '}
          para pagamentos reais direto daqui.
        </p>
      )}
      {status && <p className="status-line">{status}</p>}
    </div>
  );
}
