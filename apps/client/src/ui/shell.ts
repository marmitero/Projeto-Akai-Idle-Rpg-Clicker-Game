import {
  BALANCE,
  ironPerClick,
  mineRatePerSecond,
  type PlayerState,
} from '@akai/shared';
import { curveCost } from '@akai/shared';
import type { UiIntent } from '../net/driver.js';

export interface ShellHandlers {
  intent: (intent: UiIntent) => void;
  toggleMode: () => void;
}

const fmt = (n: number): string => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.floor(n)));

/**
 * HUD + painel de automações/melhorias em HTML (acessibilidade, master-prompt
 * §5). Ícones reais dos recursos; moeda de coins desenhada em CSS por lacuna
 * de asset registrada (docs/art/ASSET_MANIFEST.md, seção Lacunas).
 */
export class Shell {
  private hud: HTMLElement;
  private panelBody: HTMLElement;
  private tab: 'mines' | 'upgrades' = 'mines';
  private resEls = new Map<string, HTMLElement>();
  private floorLabel: HTMLElement;
  private waveLabel: HTMLElement;
  private bossTimer: HTMLElement;
  private btnAuto: HTMLButtonElement;
  private btnRetry: HTMLButtonElement;
  private banner: HTMLElement;
  private badge: HTMLButtonElement;
  private bannerTimeout = 0;

  constructor(private readonly handlers: ShellHandlers) {
    this.hud = document.getElementById('hud')!;
    this.panelBody = document.getElementById('panel-body')!;
    this.floorLabel = document.getElementById('floor-label')!;
    this.waveLabel = document.getElementById('wave-label')!;
    this.bossTimer = document.getElementById('boss-timer')!;
    this.btnAuto = document.getElementById('btn-auto') as HTMLButtonElement;
    this.btnRetry = document.getElementById('btn-retry') as HTMLButtonElement;
    this.banner = document.getElementById('banner')!;
    this.buildHud();
    document.getElementById('tab-mines')!.addEventListener('click', () => this.setTab('mines'));
    document.getElementById('tab-upgrades')!.addEventListener('click', () => this.setTab('upgrades'));
    this.btnAuto.addEventListener('click', () => {
      this.handlers.intent({ t: 'setAuto', on: !this.btnAuto.dataset.on || this.btnAuto.dataset.on === 'false' });
    });
    this.btnRetry.addEventListener('click', () => this.handlers.intent({ t: 'bossRetry' }));
    this.badge = document.getElementById('mode-badge') as HTMLButtonElement;
    this.badge.addEventListener('click', () => this.handlers.toggleMode());
  }

  private buildHud(): void {
    const entries: Array<[string, string | null]> = [
      ['coins', null],
      ['iron', '/sprites/Materials/Icon31_15.png'],
      ['coal', '/sprites/Materials/Icon31_13.png'],
      ['gold', '/sprites/Materials/Icon31_35.png'],
      ['jade', '/sprites/Materials/Icon31_40.png'],
    ];
    for (const [id, icon] of entries) {
      const div = document.createElement('div');
      div.className = `res ${id}`;
      div.id = `res-${id}`;
      if (icon) {
        const img = document.createElement('img');
        img.src = icon;
        img.alt = id;
        div.appendChild(img);
      } else {
        const coin = document.createElement('span');
        coin.className = 'coin-dot';
        coin.setAttribute('aria-hidden', 'true');
        div.appendChild(coin);
      }
      const value = document.createElement('span');
      value.textContent = '0';
      div.appendChild(value);
      this.hud.appendChild(div);
      this.resEls.set(id, value);
    }
    this.badge = document.createElement('button');
    this.badge.id = 'mode-badge';
    this.badge.type = 'button';
    this.badge.textContent = '…';
    this.hud.appendChild(this.badge);
    const style = document.createElement('style');
    style.textContent = `.coin-dot{width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 35% 30%, #ffe9a3, #f0b429 55%, #8a6410);border:1px solid #6b4d0c;display:inline-block}`;
    document.head.appendChild(style);
  }

  setTab(tab: 'mines' | 'upgrades'): void {
    this.tab = tab;
    document.getElementById('tab-mines')!.classList.toggle('active', tab === 'mines');
    document.getElementById('tab-upgrades')!.classList.toggle('active', tab === 'upgrades');
    this.panelBody.innerHTML = '';
  }

  setMode(mode: 'local' | 'online', note?: string): void {
    this.badge.textContent = mode === 'online' ? 'ONLINE' : 'LOCAL · teste';
    if (note) this.showBanner(note);
  }

  showBanner(text: string): void {
    this.banner.textContent = text;
    this.banner.style.display = 'block';
    window.clearTimeout(this.bannerTimeout);
    this.bannerTimeout = window.setTimeout(() => {
      this.banner.style.display = 'none';
    }, 2600);
  }

  render(state: PlayerState): void {
    for (const [id, el] of this.resEls) {
      const value = state.resources[id as keyof PlayerState['resources']] ?? 0;
      const visible = id === 'coins' || id === 'iron' || (state.mines[id]?.unlocked ?? false);
      const wrap = document.getElementById(`res-${id}`);
      if (wrap) wrap.style.display = visible ? 'flex' : 'none';
      el.textContent = fmt(value);
    }
    const battle = state.battle;
    this.floorLabel.textContent = `Andar ${battle.floor}`;
    this.waveLabel.textContent = battle.phase === 'boss_fighting' || battle.phase === 'boss_defeated'
      ? 'BOSS'
      : `Onda ${battle.wave + 1}/${BALANCE.floor.waves}`;
    if (battle.bossTimerMs !== null && battle.phase === 'boss_fighting') {
      this.bossTimer.style.display = 'inline';
      this.bossTimer.textContent = `${Math.max(0, Math.ceil(battle.bossTimerMs / 1000))}s`;
    } else {
      this.bossTimer.style.display = 'none';
    }
    this.btnAuto.textContent = `Auto: ${state.autoProgress ? 'ON' : 'OFF'}`;
    this.btnAuto.dataset.on = String(state.autoProgress);
    this.btnRetry.style.display = state.bossRetryAvailable ? 'block' : 'none';
    this.renderPanel(state);
  }

  private renderPanel(state: PlayerState): void {
    const body = this.panelBody;
    body.innerHTML = '';
    if (this.tab === 'mines') {
      for (const mineId of ['coal', 'gold', 'jade'] as const) {
        const def = BALANCE.mines[mineId];
        const mine = state.mines[mineId]!;
        const card = document.createElement('div');
        card.className = `card${mine.unlocked ? '' : ' locked'}`;
        const img = document.createElement('img');
        img.className = 'node';
        img.src = `/sprites/Mine/${mineId}Node.png`;
        img.alt = mineId;
        card.appendChild(img);
        const info = document.createElement('div');
        info.className = 'info';
        const name = document.createElement('div');
        name.className = 'name';
        name.textContent = `Mina de ${mineId === 'coal' ? 'carvão' : mineId === 'gold' ? 'ouro' : 'jade'}`;
        info.appendChild(name);
        const meta = document.createElement('div');
        meta.className = 'meta';
        if (mine.unlocked) {
          meta.textContent = `nv ${mine.level} · ${mineRatePerSecond(mineId, mine.level).toFixed(2)}/s`;
        } else if (def.requiresMine) {
          meta.textContent = `requer mina ${def.requiresMine[0]} nv ${def.requiresMine[1]}`;
        } else {
          meta.textContent = 'bloqueada';
        }
        info.appendChild(meta);
        const cost = document.createElement('div');
        cost.className = 'cost';
        const costMap = mine.unlocked
          ? mineCost(mineId, mine.level)
          : def.unlockCost;
        for (const [res, amount] of Object.entries(costMap)) {
          cost.appendChild(costChip(res, amount ?? 0, state));
        }
        info.appendChild(cost);
        card.appendChild(info);
        const btn = document.createElement('button');
        btn.textContent = mine.unlocked ? 'Melhorar' : 'Desbloquear';
        const affordable = canPay(costMap, state);
        const prereq = !def.requiresMine || (state.mines[def.requiresMine[0]]?.unlocked === true && (state.mines[def.requiresMine[0]]?.level ?? 0) >= def.requiresMine[1]);
        btn.disabled = !affordable || (!mine.unlocked && !prereq);
        btn.className = affordable && btn.disabled === false ? 'buyable' : '';
        btn.addEventListener('click', () =>
          this.handlers.intent(mine.unlocked ? { t: 'upgradeMine', mineId } : { t: 'unlockMine', mineId }),
        );
        card.appendChild(btn);
        body.appendChild(card);
      }
      return;
    }
    const upgrades: Array<{ id: string; name: string; desc: string; cost: Record<string, number> }> = [
      {
        id: 'click_power',
        name: 'Picareta melhor',
        desc: `+1 ferro/clique (atual ${ironPerClick(state.clickerLevel)})`,
        cost: { coins: curveCost(BALANCE.clicker.cost.base, BALANCE.clicker.cost.growth, state.clickerLevel) },
      },
      {
        id: 'warrior',
        name: 'Guerreiro',
        desc: `+2 atk, +12 hp (nv ${state.warriorLevel})`,
        cost: { iron: curveCost(BALANCE.hero.warriorCost.base, BALANCE.hero.warriorCost.growth, state.warriorLevel) },
      },
      {
        id: 'crit',
        name: 'Precisão',
        desc: `+1% crítico (nv ${state.critLevel})`,
        cost: { coins: curveCost(BALANCE.hero.critCost.base, BALANCE.hero.critCost.growth, state.critLevel + 1) },
      },
    ];
    for (const up of upgrades) {
      const card = document.createElement('div');
      card.className = 'card';
      const info = document.createElement('div');
      info.className = 'info';
      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = `${up.name} nv ${levelOf(state, up.id)}`;
      info.appendChild(name);
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = up.desc;
      info.appendChild(meta);
      const cost = document.createElement('div');
      cost.className = 'cost';
      for (const [res, amount] of Object.entries(up.cost)) cost.appendChild(costChip(res, amount, state));
      info.appendChild(cost);
      card.appendChild(info);
      const btn = document.createElement('button');
      btn.textContent = 'Comprar';
      const affordable = canPay(up.cost, state);
      btn.disabled = !affordable;
      btn.className = affordable ? 'buyable' : '';
      btn.addEventListener('click', () => this.handlers.intent({ t: 'buy', upgradeId: up.id }));
      card.appendChild(btn);
      body.appendChild(card);
    }
  }
}

const levelOf = (state: PlayerState, id: string): number =>
  id === 'click_power' ? state.clickerLevel : id === 'warrior' ? state.warriorLevel : state.critLevel;

const mineCost = (mineId: 'coal' | 'gold' | 'jade', level: number): Record<string, number> => {
  const def = BALANCE.mines[mineId];
  return {
    [def.upgradeCost.resource]: curveCost(def.upgradeCost.base, def.upgradeCost.growth, level),
    coins: curveCost(def.upgradeCost.baseCoins, def.upgradeCost.coinGrowth, level),
  };
};

const canPay = (cost: Record<string, number>, state: PlayerState): boolean =>
  Object.entries(cost).every(([res, amount]) => (state.resources[res as keyof PlayerState['resources']] ?? 0) >= amount);

const costChip = (res: string, amount: number, state: PlayerState): HTMLElement => {
  const chip = document.createElement('span');
  chip.style.display = 'inline-flex';
  chip.style.alignItems = 'center';
  chip.style.gap = '2px';
  const have = state.resources[res as keyof PlayerState['resources']] ?? 0;
  chip.style.color = have >= amount ? '#9a97b0' : '#e05656';
  if (res !== 'coins') {
    const icon = document.createElement('img');
    icon.src = `/sprites/Materials/Icon31_${res === 'iron' ? 15 : res === 'coal' ? 13 : res === 'gold' ? 35 : 40}.png`;
    icon.alt = res;
    chip.appendChild(icon);
  }
  chip.appendChild(document.createTextNode(fmt(amount)));
  return chip;
};
