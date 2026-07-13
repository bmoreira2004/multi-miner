jest.mock('react-native', () => ({
  NativeModules: {},
  NativeEventEmitter: jest.fn(),
  Platform: { OS: 'android' },
}));

import {
  NATIVE_MINING_AVAILABLE,
  startNativeMining,
  stopNativeMining,
  subscribeToHashrate,
  subscribeToShareFound,
} from '../src/lib/nativeMiningBridge';

describe('nativeMiningBridge (sem módulo nativo compilado)', () => {
  it('reporta indisponibilidade do núcleo nativo', () => {
    expect(NATIVE_MINING_AVAILABLE).toBe(false);
  });

  it('startNativeMining cai em modo stub e nunca finge hashrate real', async () => {
    const result = await startNativeMining({ seedHex: 'abc', algo: 'rx/0', threads: 2 });
    expect(result.mode).toBe('stub');
    expect(result.reason).toMatch(/não compilado/);
  });

  it('stopNativeMining não lança erro mesmo sem módulo nativo', async () => {
    await expect(stopNativeMining()).resolves.toBeUndefined();
  });

  it('subscribeToHashrate retorna no-op quando não há módulo nativo', () => {
    const unsub = subscribeToHashrate(() => {});
    expect(typeof unsub).toBe('function');
    expect(() => unsub()).not.toThrow();
  });

  it('subscribeToShareFound retorna no-op quando não há módulo nativo', () => {
    const unsub = subscribeToShareFound(() => {});
    expect(typeof unsub).toBe('function');
    expect(() => unsub()).not.toThrow();
  });
});
