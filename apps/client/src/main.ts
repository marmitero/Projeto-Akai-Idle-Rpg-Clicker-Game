import Phaser from 'phaser';
import type { GameEvent, PlayerState } from '@akai/shared';
import { BootScene, MainScene } from './game/scenes.js';
import { Shell } from './ui/shell.js';
import { LocalDriver } from './net/LocalDriver.js';
import { OnlineDriver } from './net/OnlineDriver.js';
import type { Driver, DriverHandlers, UiIntent } from './net/driver.js';

const stage = document.getElementById('stage')!;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'stage',
  pixelArt: true,
  backgroundColor: '#101018',
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%',
  },
  scene: [BootScene, MainScene],
});

let driver: Driver | null = null;
let mainScene: MainScene | null = null;
let lastState: PlayerState | null = null;
let lastOfflineJson = '';

const handlers: DriverHandlers = {
  onState: (state) => {
    lastState = state;
    shell.render(state);
    mainScene?.setState(state);
    const report = state.offlineReport;
    const json = report ? JSON.stringify(report) : '';
    if (report && json !== lastOfflineJson) {
      lastOfflineJson = json;
      shell.showOfflineReport(report);
    }
    if (!report) lastOfflineJson = '';
  },
  onEvents: (events: GameEvent[]) => {
    mainScene?.playEvents(events);
  },
  onMode: (mode, note) => {
    shell.setMode(mode, note);
  },
  onError: (code, message) => {
    if (code === 'RATE_LIMITED') shell.showBanner('Muito rápido! ' + message);
    else if (code === 'INSUFFICIENT_RESOURCES') shell.showBanner('Recursos insuficientes');
    else if (code === 'PREREQUISITE_NOT_MET') shell.showBanner('Requisito não atendido');
    else shell.showBanner(`${code}: ${message}`);
  },
};

const shell = new Shell({
  intent: (intent: UiIntent) => driver?.intent(intent),
  toggleMode: () => {
    void switchMode(driver instanceof LocalDriver ? 'online' : 'local');
  },
});

const startDriver = async (mode: 'local' | 'online'): Promise<Driver> => {
  const next: Driver = mode === 'online' ? new OnlineDriver() : new LocalDriver();
  await next.start(handlers);
  driver = next;
  wireMining();
  return next;
};

const switchMode = async (mode: 'local' | 'online'): Promise<void> => {
  driver?.stop();
  driver = null;
  shell.showBanner(mode === 'online' ? 'Conectando ao servidor…' : 'Indo para modo local…');
  try {
    await startDriver(mode);
  } catch (err) {
    if (mode === 'online') {
      shell.showBanner('Servidor indisponível — modo local ativado');
      await startDriver('local');
    } else {
      shell.showBanner(`Falha ao iniciar: ${String(err)}`);
    }
  }
};

const wireMining = (): void => {
  const scene = game.scene.getScene('main') as MainScene | null;
  mainScene = scene && scene.scene ? scene : null;
  if (mainScene) {
    mainScene.onMiningClick = () => driver?.intent({ t: 'click' });
    if (lastState) mainScene.setState(lastState);
  }
};

game.events.on('ready', () => wireMining());
window.addEventListener('akai-main-ready', () => wireMining());

void switchMode('online');

window.addEventListener('resize', () => {
  void stage;
});
