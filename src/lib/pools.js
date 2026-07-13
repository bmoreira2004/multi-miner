// Pools reais de mineração via protocolo Stratum.
// Endpoints públicos e documentados oficialmente por cada pool.
// host/port TCP puro (sem TLS) e variante SSL quando disponível.

export const COINS = {
  XMR: {
    symbol: 'XMR',
    name: 'Monero',
    algo: 'rx/0', // RandomX
    explorerBalanceApi: (address) =>
      `https://supportxmr.com/api/miner/${address}/stats`,
  },
  WOW: {
    symbol: 'WOW',
    name: 'Wownero',
    algo: 'rx/wow', // RandomWOW (variante do RandomX)
    explorerBalanceApi: (address) =>
      `https://wow.hashvault.pro/api/miner/${address}/stats`,
  },
};

export const POOLS = {
  XMR: [
    {
      id: 'supportxmr',
      name: 'SupportXMR',
      host: 'pool.supportxmr.com',
      port: 3333,
      sslPort: 5555,
      fee: 0.6,
    },
    {
      id: 'moneroocean',
      name: 'MoneroOcean',
      host: 'gulf.moneroocean.stream',
      port: 10001,
      sslPort: 20001,
      fee: 0.0, // fee dinâmica, cobrada via ajuste de dificuldade
    },
    {
      id: 'hashvault',
      name: 'HashVault',
      host: 'pool.hashvault.pro',
      port: 3333,
      sslPort: 5555,
      fee: 0.9,
    },
  ],
  WOW: [
    {
      id: 'hashvault-wow',
      name: 'HashVault (WOW)',
      host: 'wow.hashvault.pro',
      port: 3333,
      sslPort: 5555,
      fee: 0.9,
    },
    {
      id: 'moneroocean-wow',
      name: 'MoneroOcean (WOW)',
      host: 'wow.moneroocean.stream',
      port: 10128,
      sslPort: 20128,
      fee: 0.0,
    },
  ],
};

export function getPoolsForCoin(coinSymbol) {
  return POOLS[coinSymbol] || [];
}

export function getCoin(symbol) {
  return COINS[symbol];
}
