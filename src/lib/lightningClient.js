/**
 * Integração real de Lightning Network via Breez SDK (não-custodial,
 * usa nós Greenlight por trás). Envio e recebimento de pagamentos reais.
 *
 * Requer uma API key gratuita da Breez: https://breez.technology/request-api-key/
 * Sem essa key, o SDK não inicializa — não há modo "fake" aqui, propositalmente,
 * para nunca mostrar saldo Lightning que não existe de verdade.
 */
import {
  connect,
  defaultConfig,
  mnemonicToSeed,
  receivePayment,
  sendPayment,
  nodeInfo,
  EnvironmentType,
} from '@breeztech/react-native-breez-sdk';

const BREEZ_API_KEY = process.env.BREEZ_API_KEY || 'COLOQUE_SUA_API_KEY_AQUI';

let initialized = false;

export async function initLightning(mnemonic) {
  if (initialized) return;
  const seed = await mnemonicToSeed(mnemonic);
  const config = await defaultConfig(EnvironmentType.PRODUCTION, BREEZ_API_KEY);
  await connect({ config, seed });
  initialized = true;
}

export async function getLightningBalance() {
  const info = await nodeInfo();
  return {
    balanceSats: info.channelsBalanceMsat / 1000,
    onchainBalanceSats: info.onchainBalanceMsat / 1000,
    maxReceivableSats: info.maxReceivableMsat / 1000,
    maxSendableSats: info.maxPayableMsat / 1000,
  };
}

/** Gera um invoice real para receber pagamento. */
export async function createInvoice(amountSats, description) {
  const invoice = await receivePayment({
    amountMsat: amountSats * 1000,
    description: description || 'Recebimento Multi Miner',
  });
  return invoice.lnInvoice.bolt11;
}

/** Envia um pagamento real para um invoice ou endereço LNURL/BOLT11. */
export async function payInvoice(bolt11) {
  return sendPayment({ bolt11 });
}
