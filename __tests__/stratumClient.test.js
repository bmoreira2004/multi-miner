jest.mock('react-native-tcp-socket', () => {
  const listeners = {};
  return {
    createConnection: jest.fn((opts, onConnect) => {
      const socket = {
        write: jest.fn(),
        destroy: jest.fn(),
        on: jest.fn((event, cb) => {
          listeners[event] = cb;
        }),
      };
      setTimeout(onConnect, 0);
      socket.__listeners = listeners;
      return socket;
    }),
  };
});

import { StratumClient } from '../src/lib/stratumClient';

describe('StratumClient', () => {
  it('envia login com o formato correto ao conectar', (done) => {
    const client = new StratumClient({
      host: 'pool.supportxmr.com',
      port: 3333,
      walletAddress: '44AddressTest',
      workerName: 'mobile',
      algo: 'rx/0',
      onStatus: () => {},
      onJob: () => {},
    });

    client.connect();

    setTimeout(() => {
      const writeCall = client.socket.write.mock.calls[0][0];
      const parsed = JSON.parse(writeCall.trim());
      expect(parsed.method).toBe('login');
      expect(parsed.params.login).toBe('44AddressTest');
      expect(parsed.params.algo).toEqual(['rx/0']);
      done();
    }, 10);
  });

  it('processa resposta de login e dispara onJob', (done) => {
    let jobReceived = null;
    const client = new StratumClient({
      host: 'x',
      port: 1,
      walletAddress: 'addr',
      algo: 'rx/0',
      onStatus: () => {},
      onJob: (job) => {
        jobReceived = job;
      },
    });
    client.connect();

    setTimeout(() => {
      const response = JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        result: { id: 'session123', job: { job_id: 'j1', blob: 'abcd', target: 'ffff' } },
      }) + '\n';
      client.socket.__listeners.data(Buffer.from(response));

      expect(client.sessionId).toBe('session123');
      expect(jobReceived).toEqual({ job_id: 'j1', blob: 'abcd', target: 'ffff' });
      done();
    }, 10);
  });

  it('submitShare não envia nada sem sessão ativa', () => {
    const client = new StratumClient({ host: 'x', port: 1, walletAddress: 'a', algo: 'rx/0' });
    client.socket = { write: jest.fn() };
    client.submitShare('job1', 'nonce', 'result');
    expect(client.socket.write).not.toHaveBeenCalled();
  });

  it('submitShare envia payload correto quando há sessão', () => {
    const client = new StratumClient({ host: 'x', port: 1, walletAddress: 'a', algo: 'rx/0' });
    client.socket = { write: jest.fn() };
    client.sessionId = 'session123';
    client.submitShare('job1', 'noncehex', 'resulthex');

    const sent = JSON.parse(client.socket.write.mock.calls[0][0].trim());
    expect(sent.method).toBe('submit');
    expect(sent.params).toEqual({ id: 'session123', job_id: 'job1', nonce: 'noncehex', result: 'resulthex' });
  });

  it('disconnect destroi o socket e limpa estado', () => {
    const client = new StratumClient({ host: 'x', port: 1, walletAddress: 'a', algo: 'rx/0' });
    const destroyMock = jest.fn();
    client.socket = { destroy: destroyMock };
    client.connected = true;
    client.disconnect();
    expect(destroyMock).toHaveBeenCalled();
    expect(client.connected).toBe(false);
    expect(client.socket).toBeNull();
  });
});
