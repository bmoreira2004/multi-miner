import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { RandomXBridge } = NativeModules;

// Verdadeiro apenas quando o .so nativo (compilado por você, ver
// src/native/README_NATIVE_MINING.md) está presente no build.
export const NATIVE_MINING_AVAILABLE = !!RandomXBridge;

/**
 * Wrapper único usado pela UI. Se o módulo nativo não existir (build ainda
 * não compilado localmente), cai em modo STUB e deixa isso visível —
 * nunca finge hashrate real.
 */
export async function startNativeMining({ seedHex, algo, threads }) {
  if (!NATIVE_MINING_AVAILABLE) {
    return { mode: 'stub', reason: 'Núcleo nativo RandomX não compilado neste build.' };
  }
  await RandomXBridge.startMining(seedHex, algo, threads);
  return { mode: 'native' };
}

export async function stopNativeMining() {
  if (!NATIVE_MINING_AVAILABLE) return;
  await RandomXBridge.stopMining();
}

export function subscribeToHashrate(callback) {
  if (!NATIVE_MINING_AVAILABLE) return () => {};
  const emitter = new NativeEventEmitter(RandomXBridge);
  const sub = emitter.addListener('hashrate', callback);
  return () => sub.remove();
}

export function subscribeToShareFound(callback) {
  if (!NATIVE_MINING_AVAILABLE) return () => {};
  const emitter = new NativeEventEmitter(RandomXBridge);
  const sub = emitter.addListener('share', callback);
  return () => sub.remove();
}
