import { describe, expect, it } from 'vitest';
import {
  buyUpgrade,
  createInitialState,
  heroAtk,
  heroHpMax,
  upgradeCost,
} from '@akai/shared';

describe('melhorias', () => {
  it('compra sem recursos falha e não muta o estado', () => {
    const state = createInitialState(0);
    const before = JSON.stringify(state);
    const result = buyUpgrade(state, 'click_power');
    expect(result.error).toBe('INSUFFICIENT_RESOURCES');
    expect(JSON.stringify(state)).toBe(before);
  });

  it('compra com recursos debita o custo exato e sobe o nível', () => {
    const state = createInitialState(0);
    state.resources.coins = 15;
    const result = buyUpgrade(state, 'click_power');
    expect(result.error).toBeUndefined();
    expect(state.resources.coins).toBe(0);
    expect(state.clickerLevel).toBe(2);
  });

  it('recursos nunca ficam negativos mesmo com compras consecutivas', () => {
    const state = createInitialState(0);
    state.resources.coins = 40;
    state.resources.iron = 10;
    for (let i = 0; i < 10; i += 1) {
      buyUpgrade(state, 'click_power');
      buyUpgrade(state, 'warrior');
      buyUpgrade(state, 'crit');
    }
    expect(state.resources.coins).toBeGreaterThanOrEqual(0);
    expect(state.resources.iron).toBeGreaterThanOrEqual(0);
  });

  it('guerreiro aumenta atk e hp máximo conforme a fórmula', () => {
    const state = createInitialState(0);
    state.resources.iron = 10_000;
    buyUpgrade(state, 'warrior');
    expect(state.warriorLevel).toBe(2);
    expect(heroAtk(2)).toBe(8);
    expect(heroHpMax(2)).toBe(72);
  });

  it('custo segue a curva configurada', () => {
    const state = createInitialState(0);
    expect(upgradeCost(state, 'click_power')).toEqual({ coins: 15 });
    state.clickerLevel = 3;
    expect(upgradeCost(state, 'click_power')).toEqual({ coins: Math.ceil(15 * 1.4 * 1.4) });
  });

  it('upgrade desconhecido é rejeitado', () => {
    const state = createInitialState(0);
    expect(buyUpgrade(state, 'hack').error).toBe('UNKNOWN_TARGET');
  });
});
