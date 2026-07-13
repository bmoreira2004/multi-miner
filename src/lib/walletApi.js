import { getCoin } from './pools';

/**
 * Consulta o saldo real minerado (pendente + pago) diretamente na API
 * pública da pool. Cada pool compatível com XMRig expõe um endpoint
 * `/api/miner/<endereco>/stats` com esse formato.
 */
export async function fetchMinerBalance(coinSymbol, address) {
  const coin = getCoin(coinSymbol);
  if (!coin || !address) return null;

  const url = coin.explorerBalanceApi(address);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha ao consultar saldo (${res.status})`);
  }
  const data = await res.json();

  // Formato padrão das pools baseadas em node-cryptonote-pool / xmrig-proxy:
  // amtDue, amtPaid em unidades atômicas (1e12 para XMR/WOW)
  const atomicUnits = 1e12;
  return {
    pending: (data.amtDue || 0) / atomicUnits,
    paidTotal: (data.amtPaid || 0) / atomicUnits,
    hashesTotal: data.hashes || 0,
    lastHashAt: data.lastHash ? new Date(data.lastHash * 1000) : null,
  };
}
