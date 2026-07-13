import { fetchMinerBalance } from '../src/lib/walletApi';

describe('fetchMinerBalance', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('retorna null se não houver endereço', async () => {
    const result = await fetchMinerBalance('XMR', '');
    expect(result).toBeNull();
  });

  it('retorna null para moeda desconhecida', async () => {
    const result = await fetchMinerBalance('DOGE', 'addr');
    expect(result).toBeNull();
  });

  it('converte unidades atômicas corretamente', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ amtDue: 5e11, amtPaid: 2e12, hashes: 123456, lastHash: 1710000000 }),
    });

    const result = await fetchMinerBalance('XMR', '44Address');
    expect(result.pending).toBeCloseTo(0.5);
    expect(result.paidTotal).toBeCloseTo(2);
    expect(result.hashesTotal).toBe(123456);
    expect(result.lastHashAt).toBeInstanceOf(Date);
  });

  it('lança erro quando a resposta HTTP falha', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500 });
    await expect(fetchMinerBalance('XMR', 'addr')).rejects.toThrow('Falha ao consultar saldo');
  });

  it('lida com resposta sem lastHash', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ amtDue: 0, amtPaid: 0, hashes: 0 }),
    });
    const result = await fetchMinerBalance('WOW', 'wowAddr');
    expect(result.lastHashAt).toBeNull();
  });
});
