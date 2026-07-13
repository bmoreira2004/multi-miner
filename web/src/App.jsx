import WalletChecker from './components/WalletChecker';
import MiningBenchmark from './components/MiningBenchmark';
import LightningWebLN from './components/LightningWebLN';

export default function App() {
  return (
    <div className="app">
      <div className="hero">
        <p className="hero-eyebrow">XMR · WOW · Lightning</p>
        <h1>Multi Miner</h1>
        <p>
          Painel web do projeto de mineração RandomX (Monero/Wownero) com
          carteira e Lightning. Esta versão de navegador prioriza o que é
          genuinamente real fora do app mobile: consulta de saldo ao vivo,
          hashing RandomX de verdade via WASM e pagamentos Lightning via WebLN.
        </p>
        <div className="hero-links">
          <a className="btn btn-primary" href="https://github.com/bmoreira2004/criptor-miner-apk" target="_blank" rel="noreferrer">
            Ver código no GitHub
          </a>
          <a className="btn" href="https://github.com/bmoreira2004/criptor-miner-apk#como-gerar-o-apk-de-teste-na-sua-máquina" target="_blank" rel="noreferrer">
            Como gerar o APK
          </a>
        </div>
      </div>

      <div className="warn">
        Mineração conectada a uma pool real exige uma conexão Stratum (TCP),
        que o navegador não faz por segurança. O benchmark abaixo calcula
        hashes reais de RandomX no seu CPU, mas não envia shares pra nenhuma
        pool — isso é feito pelo núcleo nativo do app mobile.
      </div>

      <div className="section">
        <p className="section-label"><span className="dot" />Carteira</p>
        <WalletChecker />
      </div>

      <div className="section">
        <p className="section-label"><span className="dot" />Mineração</p>
        <MiningBenchmark />
      </div>

      <div className="section">
        <p className="section-label"><span className="dot" />Pagamentos</p>
        <LightningWebLN />
      </div>

      <footer>
        Sem anúncios. Código aberto em{' '}
        <a href="https://github.com/bmoreira2004/criptor-miner-apk" target="_blank" rel="noreferrer">
          github.com/bmoreira2004/criptor-miner-apk
        </a>.
      </footer>
    </div>
  );
}
