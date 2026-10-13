import Phaser from 'phaser';
import { BALANCE, isBossFloor, type GameEvent, type PlayerState } from '@akai/shared';
import { Actor, type ActorSource, type MultiSheetSpec } from './actors.js';
import { COMPOSITIONS, SEQUENCES } from '../assets/manifest.js';

export interface Zone {
  x: number;
  y: number;
  w: number;
  h: number;
}

const HERO_SOURCE: ActorSource = {
  kind: 'multisheet',
  spec: {
    key: 'hero',
    firstTexture: 'hero_idle',
    anims: {
      idle: { key: 'hero_idle', frameWidth: 64, frameHeight: 80, row: 0, frames: 4, fps: 6, loop: true },
      run: { key: 'hero_run', frameWidth: 80, frameHeight: 80, row: 0, frames: 8, fps: 10, loop: true },
      attack: { key: 'hero_attack', frameWidth: 96, frameHeight: 80, row: 0, frames: 8, fps: 14, loop: false },
      death: { key: 'hero_dead', frameWidth: 80, frameHeight: 64, row: 0, frames: 8, fps: 8, loop: false },
    },
  },
};

const BOSS_SOURCE: ActorSource = {
  kind: 'multisheet',
  spec: {
    key: 'boss',
    firstTexture: 'boss_idle',
    anims: {
      idle: { key: 'boss_idle', frameWidth: 480, frameHeight: 480, row: 0, frames: 0, fps: 8, loop: true },
      walk: { key: 'boss_walk', frameWidth: 480, frameHeight: 480, row: 0, frames: 0, fps: 8, loop: true },
      attack: { key: 'boss_attack', frameWidth: 480, frameHeight: 480, row: 0, frames: 0, fps: 12, loop: false },
      hurt: { key: 'boss_hurt', frameWidth: 480, frameHeight: 480, row: 0, frames: 0, fps: 12, loop: false },
      death: { key: 'boss_die', frameWidth: 480, frameHeight: 480, row: 0, frames: 0, fps: 12, loop: false },
    },
  },
};

const enemySourceFor = (floor: number, slot: number): ActorSource => {
  if (isBossFloor(floor)) return BOSS_SOURCE;
  const band = Math.floor((floor - 1) / 10) % 3;
  if (band === 0) return { kind: 'sequence', spec: SEQUENCES[0]! };
  const comps = band === 1 ? COMPOSITIONS.slice(0, 3) : COMPOSITIONS.slice(3, 6);
  return { kind: 'layered', spec: comps[slot % comps.length]! };
};

/**
 * Área superior: combate RPG lateral (GDD §2). Fundo em camadas com parallax,
 * chão de tileset real, herói à esquerda, inimigos à direita, barras de vida,
 * dano flutuante e efeitos de impacto vindos da biblioteca verificada.
 */
export class CombatView {
  private hero: Actor | null = null;
  private enemies = new Map<number, { actor: Actor; defId: string; floor: number }>();
  private hpGraphics: Phaser.GameObjects.Graphics;
  private bgLayers: Phaser.GameObjects.Image[] = [];
  private ground: Phaser.GameObjects.TileSprite | null = null;
  private floaters: Phaser.GameObjects.Text[] = [];
  private banner: Phaser.GameObjects.Text;
  private parallax = 0;

  constructor(private readonly scene: Phaser.Scene, private readonly zone: Zone) {
    this.hpGraphics = scene.add.graphics();
    this.banner = scene.add.text(zone.x + zone.w / 2, zone.y + zone.h / 2, '', {
      fontSize: '20px',
      color: '#f0b429',
      fontStyle: 'bold',
    });
    this.banner.setOrigin(0.5).setDepth(30).setAlpha(0);
    this.buildBackground();
  }

  private buildBackground(): void {
    const { x, y, w, h } = this.zone;
    const sky = this.scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0x9fd4e0);
    sky.setOrigin(0.5, 0.5);
    for (const key of ['bg_l1', 'bg_l2', 'bg_castle', 'bg_l3', 'bg_l4']) {
      const img = this.scene.add.image(x, y + h, key);
      img.setOrigin(0, 1);
      img.setDisplaySize(w, (w * 346) / 1024);
      this.bgLayers.push(img);
    }
    this.ground = this.scene.add.tileSprite(x + w / 2, y + h - 8, w, 24, 'tiles_floor', 0);
    this.ground.setOrigin(0.5, 0.5);
  }

  private groundY(): number {
    return this.zone.y + this.zone.h - 18;
  }

  private ensureHero(): Actor {
    if (!this.hero) {
      this.hero = new Actor(this.scene, HERO_SOURCE, this.zone.x + this.zone.w * 0.28, this.groundY(), 1.1);
      this.hero.setDepth(10);
    }
    return this.hero;
  }

  setState(state: PlayerState): void {
    const battle = state.battle;
    const hero = this.ensureHero();
    if (battle.phase === 'walking') hero.play('run');
    else if (battle.phase === 'idle') hero.play('idle');
    else if (battle.heroHp <= 0) hero.play('death');
    else if (hero.currentAnimName() !== 'attack') hero.play('idle');

    // reconcilia inimigos por slot
    const aliveSlots = new Set(battle.enemies.filter((e) => e.alive).map((e) => e.slot));
    for (const [slot, entry] of [...this.enemies]) {
      if (!aliveSlots.has(slot) || entry.floor !== battle.floor) {
        entry.actor.destroy();
        this.enemies.delete(slot);
      }
    }
    for (const enemy of battle.enemies) {
      if (!enemy.alive) continue;
      const existing = this.enemies.get(enemy.slot);
      if (existing && existing.defId === enemy.defId) continue;
      if (existing) {
        existing.actor.destroy();
        this.enemies.delete(enemy.slot);
      }
      const source = enemySourceFor(battle.floor, enemy.slot);
      const scale = enemy.isBoss ? 0.32 : enemySourceScale(source);
      const actor = new Actor(
        this.scene,
        source,
        this.zone.x + this.zone.w * (0.62 + enemy.slot * 0.13),
        this.groundY(),
        scale,
      );
      actor.setDepth(9 - enemy.slot);
      actor.play('idle');
      this.enemies.set(enemy.slot, { actor, defId: enemy.defId, floor: battle.floor });
    }

    this.drawHpBars(state);
  }

  private drawHpBars(state: PlayerState): void {
    const g = this.hpGraphics;
    g.clear();
    const battle = state.battle;
    const hero = this.hero;
    if (hero) {
      const hx = hero.container.x - 30;
      const hy = this.groundY() - 92;
      bar(g, hx, hy, 60, 6, state.battle.heroHp / maxHeroHp(state), 0x7fd47f);
    }
    for (const enemy of battle.enemies) {
      if (!enemy.alive) continue;
      const entry = this.enemies.get(enemy.slot);
      if (!entry) continue;
      const ex = entry.actor.container.x - 30;
      const ey = this.groundY() - (enemy.isBoss ? 150 : 84);
      bar(g, ex, ey, 60, 6, enemy.hp / enemy.hpMax, 0xe05656);
    }
  }

  playEvents(events: GameEvent[]): void {
    for (const ev of events) {
      switch (ev.t) {
        case 'hero_attack': {
          this.hero?.play('attack', true);
          const entry = this.enemies.get(ev.enemySlot);
          if (entry) {
            this.impact(entry.actor.container.x, entry.actor.container.y - 40);
            this.floater(entry.actor.container.x, entry.actor.container.y - 70, `-${ev.amount}`, ev.crit ? '#f0b429' : '#ffffff');
            entry.actor.setTint(0xff8080);
            this.scene.time.delayedCall(90, () => entry.actor.setTint(null));
          }
          break;
        }
        case 'enemy_attack': {
          for (const entry of this.enemies.values()) entry.actor.play('attack', true);
          if (this.hero) {
            this.floater(this.hero.container.x, this.groundY() - 100, `-${ev.amount}`, '#e05656');
            this.hero.setTint(0xff6060);
            this.scene.time.delayedCall(90, () => this.hero?.setTint(null));
          }
          break;
        }
        case 'enemy_death': {
          const entry = this.enemies.get(ev.enemySlot);
          if (entry) {
            entry.actor.play('death', true);
            this.floater(entry.actor.container.x, entry.actor.container.y - 80, `+${ev.coins}`, '#f0b429');
            const doomed = entry;
            this.scene.time.delayedCall(700, () => {
              doomed.actor.destroy();
              if (this.enemies.get(ev.enemySlot) === doomed) this.enemies.delete(ev.enemySlot);
            });
            this.enemies.delete(ev.enemySlot);
          }
          break;
        }
        case 'wave_clear':
          this.showBanner(`Onda ${ev.wave + 1} limpa! +${ev.bonus}`);
          break;
        case 'floor_clear':
          this.showBanner(`Andar ${ev.floor} concluído! +${ev.bonus}`);
          break;
        case 'boss_defeat':
          this.showBanner(`BOSS DERROTADO! +${ev.coins}`);
          break;
        case 'boss_timeout':
          this.showBanner(`Derrota no boss… voltando ao andar ${ev.fallbackFloor}`);
          break;
        case 'hero_down':
          this.showBanner(ev.boss ? 'O herói caiu!' : 'O herói recuperou as forças');
          break;
        case 'walk_start':
          this.parallax += 40;
          this.hero?.play('run');
          break;
        default:
          break;
      }
    }
  }

  private impact(x: number, y: number): void {
    const fx = this.scene.add.sprite(x, y, 'fx_impact', 0);
    fx.setDepth(20);
    fx.setScale(1.5);
    this.scene.tweens.add({
      targets: fx,
      scale: 2.4,
      alpha: 0,
      duration: 260,
      onComplete: () => fx.destroy(),
    });
  }

  private floater(x: number, y: number, text: string, color: string): void {
    const t = this.scene.add.text(x, y, text, { fontSize: '14px', color, fontStyle: 'bold' });
    t.setOrigin(0.5).setDepth(25);
    this.floaters.push(t);
    this.scene.tweens.add({
      targets: t,
      y: y - 34,
      alpha: 0,
      duration: 700,
      onComplete: () => {
        t.destroy();
        this.floaters = this.floaters.filter((f) => f !== t);
      },
    });
  }

  private showBanner(text: string): void {
    this.banner.setText(text);
    this.banner.setAlpha(1);
    this.scene.tweens.add({ targets: this.banner, alpha: 0, delay: 1400, duration: 500 });
  }

  resize(zone: Zone): void {
    this.zone.x = zone.x;
    this.zone.y = zone.y;
    this.zone.w = zone.w;
    this.zone.h = zone.h;
  }
}

const maxHeroHp = (state: PlayerState): number =>
  BALANCE.hero.hpBase + BALANCE.hero.hpPerLevel * (state.warriorLevel - 1);

const enemySourceScale = (source: ActorSource): number => {
  if (source.kind === 'sequence') return 1.6;
  if (source.kind === 'layered') return 1.1;
  return 1;
};

const bar = (
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  ratio: number,
  color: number,
): void => {
  const clamped = Math.max(0, Math.min(1, ratio));
  g.fillStyle(0x000000, 0.7);
  g.fillRect(x - 1, y - 1, w + 2, h + 2);
  g.fillStyle(color, 1);
  g.fillRect(x, y, w * clamped, h);
};

export type { MultiSheetSpec };
