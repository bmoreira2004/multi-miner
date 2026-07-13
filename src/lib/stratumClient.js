/**
 * Cliente Stratum real para pools Monero/Wownero (protocolo "login/job/submit").
 * Implementa o handshake e o framing de mensagens exatamente como especificado
 * pelo protocolo Stratum usado por XMRig e compatível com SupportXMR, MoneroOcean,
 * HashVault, etc. https://github.com/xmrig/xmrig/blob/master/doc/STRATUM_EXT.md
 *
 * Este módulo cuida da CONEXÃO e do PROTOCOLO. O cálculo real do hash RandomX
 * é delegado ao módulo nativo (ver src/native/) via callback `hashFunction`,
 * porque RandomX não pode ser computado com performance útil em JS puro.
 */

import TcpSocket from 'react-native-tcp-socket';

let idCounter = 1;
function nextId() {
  return idCounter++;
}

export class StratumClient {
  /**
   * @param {object} opts
   * @param {string} opts.host
   * @param {number} opts.port
   * @param {string} opts.walletAddress - endereço da carteira que recebe os pagamentos da pool
   * @param {string} opts.workerName
   * @param {string} opts.algo - ex: 'rx/0' (XMR) ou 'rx/wow' (WOW)
   * @param {(job: object) => void} opts.onJob
   * @param {(hashrate: number) => void} opts.onHashrate
   * @param {(accepted: boolean, message?: string) => void} opts.onShareResult
   * @param {(status: string) => void} opts.onStatus
   */
  constructor(opts) {
    this.opts = opts;
    this.socket = null;
    this.buffer = '';
    this.sessionId = null;
    this.connected = false;
  }

  connect() {
    const { host, port, onStatus } = this.opts;
    onStatus && onStatus(`Conectando a ${host}:${port}...`);

    this.socket = TcpSocket.createConnection({ host, port, tls: false }, () => {
      this.connected = true;
      onStatus && onStatus('Conectado. Autenticando (login)...');
      this._login();
    });

    this.socket.on('data', (data) => this._onData(data));
    this.socket.on('error', (err) => {
      onStatus && onStatus(`Erro de conexão: ${err?.message || err}`);
    });
    this.socket.on('close', () => {
      this.connected = false;
      onStatus && onStatus('Conexão encerrada.');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    this.connected = false;
  }

  _login() {
    const { walletAddress, workerName, algo } = this.opts;
    const payload = {
      id: nextId(),
      jsonrpc: '2.0',
      method: 'login',
      params: {
        login: walletAddress,
        pass: workerName || 'multi-miner-mobile',
        agent: 'multi-miner/1.0.0',
        algo: [algo],
      },
    };
    this._send(payload);
  }

  _send(obj) {
    if (!this.socket) return;
    // Framing Stratum: uma linha JSON por mensagem, terminada em \n
    this.socket.write(JSON.stringify(obj) + '\n');
  }

  _onData(data) {
    this.buffer += data.toString('utf8');
    let idx;
    while ((idx = this.buffer.indexOf('\n')) >= 0) {
      const line = this.buffer.slice(0, idx).trim();
      this.buffer = this.buffer.slice(idx + 1);
      if (line.length === 0) continue;
      this._handleLine(line);
    }
  }

  _handleLine(line) {
    let msg;
    try {
      msg = JSON.parse(line);
    } catch (e) {
      this.opts.onStatus && this.opts.onStatus(`Mensagem inválida da pool: ${line}`);
      return;
    }

    // Resposta ao login
    if (msg.result && msg.result.id && msg.result.job) {
      this.sessionId = msg.result.id;
      this.opts.onStatus && this.opts.onStatus('Login aceito. Job recebido.');
      this.opts.onJob && this.opts.onJob(msg.result.job);
      return;
    }

    // Novo job enviado a qualquer momento
    if (msg.method === 'job' && msg.params) {
      this.opts.onJob && this.opts.onJob(msg.params);
      return;
    }

    // Resposta a um submit de share
    if (msg.id && (msg.result !== undefined || msg.error !== undefined)) {
      if (msg.error) {
        this.opts.onShareResult && this.opts.onShareResult(false, msg.error.message);
      } else {
        this.opts.onShareResult && this.opts.onShareResult(true);
      }
      return;
    }

    if (msg.error) {
      this.opts.onStatus && this.opts.onStatus(`Erro da pool: ${msg.error.message || JSON.stringify(msg.error)}`);
    }
  }

  /**
   * Envia um share encontrado pelo motor de hashing nativo.
   * @param {string} jobId
   * @param {string} nonce - hex
   * @param {string} result - hash resultante em hex
   */
  submitShare(jobId, nonce, result) {
    if (!this.sessionId) return;
    this._send({
      id: nextId(),
      jsonrpc: '2.0',
      method: 'submit',
      params: {
        id: this.sessionId,
        job_id: jobId,
        nonce,
        result,
      },
    });
  }
}
