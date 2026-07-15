/**
 * Resolve um "Lightning Address" (padrão LUD-16, ex: nome@walletofsatoshi.com)
 * em um invoice (bolt11) real, pronto pra pagar. É assim que carteiras como
 * Wallet of Satoshi, Alby, Muun, etc. expõem um "endereço fixo" de recebimento.
 *
 * Especificação: https://github.com/lnurl/luds/blob/luds/16.md
 */

export function isLightningAddress(input) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((input || '').trim());
}

export function isBolt11(input) {
  return /^ln(bc|tb)[0-9a-z]+$/i.test((input || '').trim());
}

/**
 * @param {string} address - ex: "nome@walletofsatoshi.com"
 * @param {number} amountSats
 * @returns {Promise<string>} bolt11 invoice pronto pra pagar
 */
export async function resolveLightningAddress(address, amountSats) {
  const [user, domain] = address.trim().split('@');
  if (!user || !domain) {
    throw new Error('Endereço Lightning inválido. Use o formato nome@dominio.com');
  }

  const metaUrl = `https://${domain}/.well-known/lnurlp/${user}`;
  const metaRes = await fetch(metaUrl);
  if (!metaRes.ok) {
    throw new Error(`Não consegui resolver ${address} (${metaRes.status}). Confira se o endereço está correto.`);
  }
  const meta = await metaRes.json();

  if (meta.status === 'ERROR') {
    throw new Error(meta.reason || 'Endereço Lightning recusou a solicitação.');
  }

  const amountMsat = Math.round(amountSats * 1000);
  if (meta.minSendable && amountMsat < meta.minSendable) {
    throw new Error(`Valor mínimo para este endereço: ${Math.ceil(meta.minSendable / 1000)} sats.`);
  }
  if (meta.maxSendable && amountMsat > meta.maxSendable) {
    throw new Error(`Valor máximo para este endereço: ${Math.floor(meta.maxSendable / 1000)} sats.`);
  }

  const sep = meta.callback.includes('?') ? '&' : '?';
  const callbackUrl = `${meta.callback}${sep}amount=${amountMsat}`;
  const invoiceRes = await fetch(callbackUrl);
  if (!invoiceRes.ok) {
    throw new Error(`O provedor de ${domain} não retornou o invoice (${invoiceRes.status}).`);
  }
  const invoiceData = await invoiceRes.json();
  if (invoiceData.status === 'ERROR') {
    throw new Error(invoiceData.reason || 'Falha ao gerar invoice a partir do endereço Lightning.');
  }
  if (!invoiceData.pr) {
    throw new Error('Resposta do provedor não trouxe um invoice válido.');
  }
  return invoiceData.pr;
}

/**
 * Aceita tanto um bolt11 direto quanto um Lightning Address — resolve
 * automaticamente pro formato certo antes de pagar.
 */
export async function resolveToBolt11(input, amountSats) {
  const trimmed = (input || '').trim();
  if (isBolt11(trimmed)) return trimmed;
  if (isLightningAddress(trimmed)) {
    if (!amountSats || amountSats <= 0) {
      throw new Error('Informe o valor em sats para pagar um endereço Lightning.');
    }
    return resolveLightningAddress(trimmed, amountSats);
  }
  throw new Error('Cole um invoice (lnbc...) ou um endereço Lightning (nome@dominio.com).');
}
