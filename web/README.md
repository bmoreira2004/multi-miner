# Multi Miner — Web

Versão de navegador, publicada em: **https://bmoreira2004.github.io/multi-miner/**

## O que é real aqui

- **Carteira**: consulta ao vivo do saldo minerado direto na API da pool.
- **Mineração**: benchmark real de hashing RandomX/RandomWOW, calculado no seu
  CPU via WebAssembly (`randomx.js`). Os hashes são genuínos e seguem a
  especificação do algoritmo — só que não estão conectados a nenhuma pool.
- **Lightning**: pagamentos reais via padrão **WebLN** (funciona com a
  extensão Alby, getalby.com).

## Por que a mineração aqui não envia para uma pool

Navegadores não permitem conexão TCP direta (necessária para o protocolo
Stratum das pools). Para conectar de verdade, seria preciso um proxy
WebSocket↔TCP rodando em algum servidor — GitHub Pages só serve arquivos
estáticos, não roda esse tipo de processo.

Se você quiser ir além e ter mineração web conectada de verdade a uma pool,
ferramentas prontas para isso (você mesmo hospeda, ex: Render, Railway, uma VPS):
- https://github.com/MoneroOcean/webminerpool
- https://github.com/trey-jones/xmrwasp

## Rodar localmente
```bash
npm install
npm run dev
```

## Build e deploy manual
```bash
npm run build
npx gh-pages -d dist -b gh-pages
```
