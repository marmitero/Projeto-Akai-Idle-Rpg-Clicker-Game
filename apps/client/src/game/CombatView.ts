import Phaser from 'phaser';
import { BALANCE, isBossFloor, type GameEvent, type PlayerState } from '@akai/shared';
import { Actor, type ActorSource, type MultiSheetSpec } from './actors.js';
import { COMPOSITIONS, SEQUENCES } from '../assets/manifest.js';
import { buildGround } from './ground.js';
import { renderProps } from './props.js';
import {
  cssColor,
  defaultLayout,
  loadLayout,
  VEG_ANCHOR_Y,
  type BgLayerLayout,
  type ZoneLayout,
} from './sceneLayout.js';
import type { Zone } from './zones.js';

export const HERO_SOURCE: ActorSource = {
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
 * As bases Male/Female Base olham para a DIREITA no asset original; como os
 * inimigos ficam à direita do herói, elas precisam de flip horizontal para
 * não lutar "de costas" (reportado e corrigido em 2026-10-13).
 */
const needsFlip = (source: ActorSource): boolean => source.kind === 'layered';

const PARALLAX_MARGIN = 96;
/**
 * Ancoragem verificada por mockup (tools/out/previews/mock_combat3.png):
 * o céu (l1) ancora o canvas inteiro ao chão; as demais camadas ancoram a
 * linha de vegetação (y~175 do canvas 1024x346) logo acima do chão de batalha,
 * senão o cenário "flutua" e sobra uma faixa vazia no meio da zona.
 */
interface EnemyEntry {
  actor: Actor;
  defId: string;
  floor: number;
  x: number;
}

/**
 * Área superior: combate RPG lateral (GDD §2).
 * Fundo composto pelas 5 camadas reais na MESMA origem/escala (composição
 * correta do pack GandalfHardcore) com parallax de câmera (sway + deriva de
 * caminhada + offset por andar); chão de tileset 96x96 sem frestas;
 * combatentes SE APROXIMAM até a distância de engajamento antes de lutar.
 */
export class CombatView {
  private hero: Actor | null = null;
  private heroX = 0;
  private enemies = new Map<number, EnemyEntry>();
  private hpGraphics: Phaser.GameObjects.Graphics;
  private bgSprites: Phaser.GameObjects.Image[] = [];
  private groundTop = 0;
  private floaters: Phaser.GameObjects.Text[] = [];
  private banner: Phaser.GameObjects.Text;
  private parallaxBase = 0;
  private walkDrift = 0;
  private swayT = 0;
  private lastFloor = 0;
  private state: PlayerState | null = null;

  constructor(private readonly scene: Phaser.Scene, private readonly zone: Zone) {
    this.hpGraphics = scene.add.graphics();
    this.hpGraphics.setDepth(12);
    this.banner = scene.add.text(zone.x + zone.w / 2, zone.y + zone.h / 2, '', {
      fontSize: '20px',
      color: '#f0b429',
      fontStyle: 'bold',
    });
    this.banner.setOrigin(0.5).setDepth(30).setAlpha(0);
    // cenário vem do layout editável (Tile Editor); sem layout salvo, o
    // default reproduz exatamente a composição procedural anterior
    this.layout = loadLayout()?.arena ?? defaultLayout().arena;
    this.groundTop = zone.y + zone.h - this.layout.ground.cropH;
    buildGround(scene, zone.x, zone.y + zone.h, zone.w, {
      frame: 0,
      cells: this.layout.ground.cells,
      cropH: this.layout.ground.cropH,
      dirtColor: cssColor(this.layout.ground.fill, 0x241a12),
    }).container.setDepth(1);
    this.buildBackground();
    renderProps(scene, zone, this.groundTop, this.layout.props);
    this.heroX = zone.x + zone.w * 0.3;
    this.lastFloor = -1;
  }

  private layout: ZoneLayout;

  private buildBackground(): void {
    const { x, y, w, h } = this.zone;
    const sky = this.scene.add.rectangle(x + w / 2, y + h / 2, w, h, cssColor(this.layout.sky, 0x9fd0dc));
    sky.setDepth(-10);
    // todas as camadas compartilham origem e escala: é assim que o pack
    // compone o cenário (bandas em alturas diferentes do mesmo canvas)
    this.bgScale = (w + PARALLAX_MARGIN) / 1024;
    this.bgLayers = [];
    for (const layer of this.layout.bg) {
      if (!layer.visible || !this.scene.textures.exists(layer.key)) continue;
      const img = this.scene.add.image(0, 0, layer.key);
      img.setOrigin(0, 0);
      img.setScale(this.bgScale);
      img.setDepth(-9 + this.bgLayers.length);
      this.bgSprites.push(img);
      this.bgLayers.push(layer);
    }
    this.bgTop = this.groundTop - 346 * this.bgScale;
  }

  private bgTop = 0;
  private bgScale = 1;
  private bgLayers: BgLayerLayout[] = [];

  private applyParallax(offset: number): void {
    const { x } = this.zone;
    this.bgSprites.forEach((img, i) => {
      const layer = this.bgLayers[i];
      if (!layer) return;
      const y = layer.anchor === 'veg'
        ? this.groundTop - VEG_ANCHOR_Y * this.bgScale + layer.dy
        : this.bgTop;
      img.setPosition(Math.round(x - PARALLAX_MARGIN + offset * layer.factor), Math.round(y));
    });
  }

  private actorsY(): number {
    return this.groundTop + 8;
  }

  private ensureHero(): Actor {
    if (!this.hero) {
      this.hero = new Actor(this.scene, HERO_SOURCE, this.heroX, this.actorsY(), 1.1);
      this.hero.setDepth(10);
    }
    return this.hero;
  }

  setState(state: PlayerState): void {
    this.state = state;
    const battle = state.battle;
    if (battle.floor !== this.lastFloor) {
      this.lastFloor = battle.floor;
      this.parallaxBase = (battle.floor * 37) % PARALLAX_MARGIN;
      this.walkDrift = 0;
    }
    this.ensureHero();

    // reconcilia inimigos por slot/andar
    const alive = new Set(battle.enemies.filter((e) => e.alive).map((e) => e.slot));
    for (const [slot, entry] of [...this.enemies]) {
      if (!alive.has(slot) || entry.floor !== battle.floor) {
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
      const scale = enemy.isBoss ? 0.32 : source.kind === 'sequence' ? 1.5 : 1.1;
      const spawnX = this.zone.x + this.zone.w + 40 + enemy.slot * 26;
      const actor = new Actor(this.scene, source, spawnX, this.actorsY(), scale);
      if (needsFlip(source)) actor.setFlipX(true);
      actor.setDepth(9 - enemy.slot);
      actor.play('walk');
      this.enemies.set(enemy.slot, { actor, defId: enemy.defId, floor: battle.floor, x: spawnX });
    }
  }

  /** Loop de quadro: parallax, aproximação dos combatentes e animações base. */
  update(dtMs: number): void {
    const state = this.state;
    if (!state) return;
    const battle = state.battle;
    const dt = dtMs / 1000;
    this.swayT += dtMs;

    if (battle.phase === 'walking') {
      this.walkDrift = Math.min(PARALLAX_MARGIN * 0.6, this.walkDrift + dt * 70);
    }
    const sway = Math.sin(this.swayT / 900) * 5;
    this.applyParallax(this.parallaxBase + this.walkDrift + sway);

    const hero = this.ensureHero();
    const fighting = battle.phase === 'fighting' || battle.phase === 'boss_fighting';

    // formação: inimigos caminham até a distância de engajamento do herói
    const frontSlot = battle.enemies.filter((e) => e.alive).map((e) => e.slot).sort((a, b) => a - b)[0];
    const engage = battle.phase === 'boss_fighting' ? 110 : 64;
    const heroHome = this.zone.x + this.zone.w * 0.3;
    let heroTarget = heroHome;
    if (fighting && frontSlot !== undefined) {
      const front = this.enemies.get(frontSlot);
      if (front) heroTarget = Math.min(heroHome, front.x - engage);
    }
    const heroSpeed = 130;
    const heroDx = heroTarget - this.heroX;
    const heroStep = Math.sign(heroDx) * Math.min(Math.abs(heroDx), heroSpeed * dt);
    this.heroX += heroStep;
    hero.setPosition(this.heroX, this.actorsY());

    if (battle.phase === 'walking') hero.play('run');
    else if (Math.abs(heroDx) > 4) hero.play('run');
    else if (hero.currentAnimName() !== 'attack' && hero.currentAnimName() !== 'death') hero.play('idle');

    for (const enemy of battle.enemies) {
      if (!enemy.alive) continue;
      const entry = this.enemies.get(enemy.slot);
      if (!entry) continue;
      const target = this.heroX + engage + enemy.slot * 36;
      const dx = target - entry.x;
      const speed = enemy.isBoss ? 55 : 95;
      const step = Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
      entry.x += step;
      entry.actor.setPosition(entry.x, this.actorsY());
      const anim = entry.actor.currentAnimName();
      if (anim !== 'attack' && anim !== 'death') {
        entry.actor.play(Math.abs(dx) > 4 ? 'walk' : 'idle');
      }
    }

    this.drawHpBars(state);
  }

  private drawHpBars(state: PlayerState): void {
    const g = this.hpGraphics;
    g.clear();
    const battle = state.battle;
    if (this.hero) {
      bar(g, this.heroX - 30, this.actorsY() - 92, 60, 6, battle.heroHp / maxHeroHp(state), 0x7fd47f);
    }
    for (const enemy of battle.enemies) {
      if (!enemy.alive) continue;
      const entry = this.enemies.get(enemy.slot);
      if (!entry) continue;
      bar(g, entry.x - 30, this.actorsY() - (enemy.isBoss ? 150 : 84), 60, 6, enemy.hp / enemy.hpMax, 0xe05656);
    }
  }

  playEvents(events: GameEvent[]): void {
    for (const ev of events) {
      switch (ev.t) {
        case 'hero_attack': {
          this.hero?.play('attack', true);
          this.lunge(this.hero, 16);
          const entry = this.enemies.get(ev.enemySlot);
          if (entry) {
            this.impact(entry.x, this.actorsY() - 44);
            this.floater(entry.x, this.actorsY() - 74, `-${ev.amount}`, ev.crit ? '#f0b429' : '#ffffff');
            entry.actor.setTint(0xff8080);
            this.scene.time.delayedCall(90, () => entry.actor.setTint(null));
          }
          break;
        }
        case 'enemy_attack': {
          for (const entry of this.enemies.values()) {
            entry.actor.play('attack', true);
            this.lunge(entry.actor, -16);
          }
          if (this.hero) {
            this.floater(this.heroX, this.actorsY() - 100, `-${ev.amount}`, '#e05656');
            this.hero.setTint(0xff6060);
            this.scene.time.delayedCall(90, () => this.hero?.setTint(null));
          }
          break;
        }
        case 'enemy_death': {
          const entry = this.enemies.get(ev.enemySlot);
          if (entry) {
            entry.actor.play('death', true);
            this.floater(entry.x, entry.actor.container.y - 80, `+${ev.coins}`, '#f0b429');
            const doomed = entry;
            this.enemies.delete(ev.enemySlot);
            this.scene.time.delayedCall(700, () => doomed.actor.destroy());
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
          this.hero?.play('run');
          break;
        default:
          break;
      }
    }
  }

  private lunge(actor: Actor | null, dx: number): void {
    if (!actor) return;
    const base = actor.container.x;
    this.scene.tweens.add({
      targets: actor.container,
      x: base + dx,
      duration: 90,
      yoyo: true,
      onComplete: () => actor.container.setX(base),
    });
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
}

const maxHeroHp = (state: PlayerState): number =>
  BALANCE.hero.hpBase + BALANCE.hero.hpPerLevel * (state.warriorLevel - 1);

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
