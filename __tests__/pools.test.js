import { COINS, POOLS, getPoolsForCoin, getCoin } from '../src/lib/pools';

describe('pools', () => {
  it('define XMR e WOW como moedas suportadas', () => {
    expect(Object.keys(COINS)).toEqual(expect.arrayContaining(['XMR', 'WOW']));
  });

  it('cada moeda tem algoritmo RandomX e função de saldo', () => {
    Object.values(COINS).forEach((coin) => {
      expect(coin.algo).toMatch(/^rx\//);
      expect(typeof coin.explorerBalanceApi).toBe('function');
    });
  });

  it('getPoolsForCoin retorna ao menos uma pool real para cada moeda', () => {
    Object.keys(COINS).forEach((symbol) => {
      const pools = getPoolsForCoin(symbol);
      expect(pools.length).toBeGreaterThan(0);
      pools.forEach((p) => {
        expect(p.host).toEqual(expect.any(String));
        expect(p.port).toEqual(expect.any(Number));
      });
    });
  });

  it('getPoolsForCoin retorna array vazio para moeda inexistente', () => {
    expect(getPoolsForCoin('DOGE')).toEqual([]);
  });

  it('getCoin retorna undefined para símbolo desconhecido', () => {
    expect(getCoin('DOGE')).toBeUndefined();
  });

  it('URLs de API de saldo são geradas corretamente por endereço', () => {
    const url = COINS.XMR.explorerBalanceApi('44AbcTest');
    expect(url).toContain('44AbcTest');
    expect(url).toContain('supportxmr.com');
  });
});
