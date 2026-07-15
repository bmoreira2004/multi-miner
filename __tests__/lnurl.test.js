import { isLightningAddress, isBolt11, resolveLightningAddress, resolveToBolt11 } from '../src/lib/lnurl';

describe('isLightningAddress', () => {
  it('reconhece um endereço válido', () => {
    expect(isLightningAddress('nome@walletofsatoshi.com')).toBe(true);
  });
  it('rejeita bolt11', () => {
    expect(isLightningAddress('lnbc1000n1p...')).toBe(false);
  });
  it('rejeita string vazia', () => {
    expect(isLightningAddress('')).toBe(false);
  });
});

describe('isBolt11', () => {
  it('reconhece um invoice mainnet', () => {
    expect(isBolt11('lnbc1000n1pabcdefg')).toBe(true);
  });
  it('reconhece um invoice testnet', () => {
    expect(isBolt11('lntb1000n1pabcdefg')).toBe(true);
  });
  it('rejeita um endereço Lightning', () => {
    expect(isBolt11('nome@walletofsatoshi.com')).toBe(false);
  });
});

describe('resolveLightningAddress', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('resolve um endereço válido para um bolt11', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ callback: 'https://walletofsatoshi.com/lnurlp/cb/nome', minSendable: 1000, maxSendable: 1000000000 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pr: 'lnbc1000n1presolved' }),
      });

    const bolt11 = await resolveLightningAddress('nome@walletofsatoshi.com', 100);
    expect(bolt11).toBe('lnbc1000n1presolved');
    expect(global.fetch).toHaveBeenNthCalledWith(1, 'https://walletofsatoshi.com/.well-known/lnurlp/nome');
    expect(global.fetch).toHaveBeenNthCalledWith(2, 'https://walletofsatoshi.com/lnurlp/cb/nome?amount=100000');
  });

  it('rejeita endereço malformado', async () => {
    await expect(resolveLightningAddress('endereco-invalido', 100)).rejects.toThrow('inválido');
  });

  it('lança erro quando valor está abaixo do mínimo', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ callback: 'https://x.com/cb', minSendable: 5000000, maxSendable: 1000000000 }),
    });
    await expect(resolveLightningAddress('nome@x.com', 100)).rejects.toThrow('mínimo');
  });

  it('lança erro quando o domínio responde com erro', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 404 });
    await expect(resolveLightningAddress('nome@x.com', 100)).rejects.toThrow('Não consegui resolver');
  });

  it('lança erro quando o status da resposta é ERROR', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ERROR', reason: 'Usuário não encontrado' }),
    });
    await expect(resolveLightningAddress('nome@x.com', 100)).rejects.toThrow('Usuário não encontrado');
  });
});

describe('resolveToBolt11', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('retorna bolt11 diretamente se já for um invoice', async () => {
    const result = await resolveToBolt11('lnbc1000n1pabc', 100);
    expect(result).toBe('lnbc1000n1pabc');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('exige valor em sats para endereço Lightning', async () => {
    await expect(resolveToBolt11('nome@walletofsatoshi.com', 0)).rejects.toThrow('Informe o valor');
  });

  it('rejeita entrada que não é nem invoice nem endereço', async () => {
    await expect(resolveToBolt11('texto qualquer', 100)).rejects.toThrow('Cole um invoice');
  });
});
