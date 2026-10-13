import Phaser from 'phaser';
import { preloadAssets } from '../game/scenes.js';
import { EDITOR_ARENA_H, EDITOR_W, EditorScene } from './EditorScene.js';
import { initPanel } from './panel.js';

class EditorBootScene extends Phaser.Scene {
  constructor() {
    super('editor-boot');
  }

  preload(): void {
    preloadAssets(this);
  }

  create(): void {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
    this.scene.start('editor');
  }
}

const STYLE = `
  #editor-root {
    position: fixed; inset: 0; z-index: 50; overflow: auto;
    background: #07070c; color: #e8e6da;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    display: flex; gap: 12px; padding: 12px; align-items: flex-start;
    justify-content: center; flex-wrap: wrap;
  }
  #ed-canvas { flex: 0 0 auto; }
  #ed-canvas canvas { image-rendering: pixelated; width: ${EDITOR_W * 2}px; border: 1px solid #3a3a55; border-radius: 6px; }
  #ed-panel {
    flex: 0 1 380px; min-width: 320px; max-height: 92vh; overflow-y: auto;
    display: flex; flex-direction: column; gap: 10px;
    background: #141420; border: 1px solid #3a3a55; border-radius: 8px; padding: 10px;
  }
  #ed-panel .ed-sec { border-bottom: 1px solid #262640; padding-bottom: 8px; }
  #ed-panel .ed-title { font-weight: 800; font-size: 15px; color: #f0b429; margin-bottom: 6px; }
  #ed-panel .ed-label { font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: #9a97b0; margin: 4px 0; }
  #ed-panel .ed-btns { display: flex; flex-wrap: wrap; gap: 6px; }
  #ed-panel button {
    background: #262640; color: #e8e6da; border: 1px solid #3a3a55; border-radius: 6px;
    padding: 6px 8px; font-size: 12px; cursor: pointer; min-height: 32px;
  }
  #ed-panel button.active { background: #4a3a10; border-color: #f0b429; color: #ffd97a; }
  #ed-panel button:disabled { opacity: .4; cursor: not-allowed; }
  #ed-panel .ed-row { display: flex; align-items: center; gap: 6px; font-size: 12px; margin: 4px 0; flex-wrap: wrap; }
  #ed-panel .ed-muted { font-size: 11px; color: #9a97b0; }
  #ed-panel .ed-tiles { display: flex; flex-wrap: wrap; gap: 4px; }
  #ed-panel .ed-thumb {
    width: 48px; height: 48px; padding: 0; border: 2px solid #3a3a55; border-radius: 4px;
    background-color: #0d0d16; image-rendering: pixelated;
  }
  #ed-panel .ed-thumb.active { border-color: #f0b429; }
  #ed-panel .ed-layer { font-size: 11px; }
  #ed-panel .ed-layer-name { flex: 1 1 90px; }
  #ed-panel .ed-help p { font-size: 11px; color: #9a97b0; line-height: 1.5; }
  #ed-toast {
    position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
    background: #2c4a2c; border: 1px solid #4d7c4d; color: #dff0df;
    padding: 6px 12px; border-radius: 6px; font-size: 12px; opacity: 0; transition: opacity .2s;
    pointer-events: none; z-index: 60;
  }
  #ed-toast.show { opacity: 1; }
`;

/** Boot do Tile Editor (rota `#/editor`): canvas Phaser + painel DOM. */
export const bootEditor = (): void => {
  const app = document.getElementById('app');
  if (app) app.style.display = 'none';

  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'editor-root';
  root.innerHTML = '<div id="ed-canvas"></div><div id="ed-panel"></div>';
  document.body.appendChild(root);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'ed-canvas',
    pixelArt: true,
    backgroundColor: '#07070c',
    scale: { mode: Phaser.Scale.NONE, width: EDITOR_W, height: EDITOR_ARENA_H },
    scene: [EditorBootScene, EditorScene],
  });

  // as cenas da config são instanciadas no boot do Game: o painel já pode
  // editar o layout mesmo antes dos assets terminarem de carregar
  const editor = game.scene.getScene('editor') as EditorScene;
  initPanel(document.getElementById('ed-panel') as HTMLElement, editor);
};
