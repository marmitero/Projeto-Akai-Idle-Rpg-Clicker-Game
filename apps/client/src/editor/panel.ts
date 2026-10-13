import {
  clearLayout,
  defaultLayout,
  parseLayout,
  saveLayout,
  type BgLayerLayout,
} from '../game/sceneLayout.js';
import { BG_NAMES, PROP_ASSETS, TILE_FRAMES, TILE_SHEET_URL, TOOLS, type ToolId } from './palette.js';
import type { EditorScene } from './EditorScene.js';

/**
 * Painel DOM do Tile Editor. Edita o layout vivo da EditorScene (somente
 * assets reais do manifesto) e persiste em localStorage a cada alteração.
 */
export const initPanel = (root: HTMLElement, scene: EditorScene): void => {
  root.innerHTML = `
    <div class="ed-sec" id="ed-head">
      <div class="ed-title">Tile Editor — Projeto Akai</div>
      <div class="ed-btns">
        <button data-act="save">Salvar</button>
        <button data-act="play">Testar no jogo</button>
        <button data-act="export">Exportar</button>
        <button data-act="import">Importar</button>
        <button data-act="reset">Reset</button>
        <button data-act="back">Voltar ao jogo</button>
      </div>
      <input type="file" id="ed-file" accept="application/json" style="display:none" />
      <div id="ed-toast"></div>
    </div>
    <div class="ed-sec">
      <div class="ed-label">Zona</div>
      <div class="ed-btns">
        <button data-zone="arena">Arena (combate)</button>
        <button data-zone="mine">Mina (clique)</button>
      </div>
    </div>
    <div class="ed-sec">
      <div class="ed-label">Ferramenta</div>
      <div class="ed-btns" id="ed-tools"></div>
      <label class="ed-row"><input type="checkbox" id="ed-grid" /> grade de tiles (96px)</label>
    </div>
    <div class="ed-sec">
      <div class="ed-label">Tiles do chão/teto (tileset 96x96)</div>
      <div class="ed-tiles" id="ed-tiles"></div>
    </div>
    <div class="ed-sec">
      <div class="ed-label">Assets colocáveis (ferramenta "Colocar asset")</div>
      <div class="ed-tiles" id="ed-assets"></div>
    </div>
    <div class="ed-sec" id="ed-bg-sec">
      <div class="ed-label">Fundo da arena</div>
      <label class="ed-row">céu <input type="color" id="ed-sky" /></label>
      <div id="ed-bg-layers"></div>
    </div>
    <div class="ed-sec" id="ed-mine-sec">
      <div class="ed-label">Caverna da mina</div>
      <label class="ed-row">tom superior <input type="color" id="ed-m-sky" /></label>
      <label class="ed-row"><input type="checkbox" id="ed-m-sky2-on" /> 2º tom <input type="color" id="ed-m-sky2" /></label>
      <label class="ed-row"><input type="checkbox" id="ed-m-posts" /> escoras de madeira</label>
      <label class="ed-row">altura do teto <input type="number" id="ed-m-ceilh" min="4" max="96" step="2" /></label>
    </div>
    <div class="ed-sec">
      <div class="ed-label">Chão da zona atual</div>
      <label class="ed-row">altura do topo <input type="number" id="ed-g-croph" min="8" max="96" step="2" /></label>
      <label class="ed-row">cor abaixo do topo <input type="color" id="ed-g-fill" /></label>
    </div>
    <div class="ed-sec" id="ed-sel-sec">
      <div class="ed-label">Asset selecionado</div>
      <div id="ed-sel-body"></div>
    </div>
    <div class="ed-sec ed-help">
      <div class="ed-label">Como usar</div>
      <p>1. Escolha a zona e a ferramenta. 2. Clique no cenário para pintar tiles,
      abrir buracos ou colocar o asset escolhido. 3. Com "Selecionar/mover",
      arraste assets e ajuste escala/espelho/profundidade abaixo. 4. "Testar no
      jogo" aplica o cenário no jogo real. Tudo é salvo neste navegador.</p>
    </div>`;

  const $ = <T extends HTMLElement = HTMLInputElement>(sel: string): T => root.querySelector(sel) as T;
  const toast = (msg: string): void => {
    const el = $('#ed-toast');
    el.textContent = msg;
    el.classList.add('show');
    window.setTimeout(() => el.classList.remove('show'), 1600);
  };

  /* ------------------------------ paletas ------------------------------ */
  const tilesBox = $('#ed-tiles');
  for (const t of TILE_FRAMES) {
    const col = t.frame % 3;
    const row = Math.floor(t.frame / 3);
    const b = document.createElement('button');
    b.className = 'ed-thumb';
    b.title = `#${t.frame} ${t.label}`;
    b.style.backgroundImage = `url("${TILE_SHEET_URL}")`;
    b.style.backgroundSize = '144px 288px';
    b.style.backgroundPosition = `${-col * 48}px ${-row * 48}px`;
    b.dataset.frame = String(t.frame);
    b.addEventListener('click', () => {
      scene.setTileFrame(t.frame);
      if (scene.getTool() !== 'tile' && scene.getTool() !== 'ceil') scene.setTool('tile');
      refresh();
    });
    tilesBox.appendChild(b);
  }
  const assetsBox = $('#ed-assets');
  for (const a of PROP_ASSETS) {
    const b = document.createElement('button');
    b.className = 'ed-thumb ed-thumb-asset';
    b.title = a.label;
    b.style.backgroundImage = `url("${a.url}")`;
    b.style.backgroundSize = 'contain';
    b.style.backgroundRepeat = 'no-repeat';
    b.style.backgroundPosition = 'center';
    b.dataset.key = a.key;
    b.addEventListener('click', () => {
      scene.setPropSrc({ kind: 'image', key: a.key });
      scene.setTool('prop');
      refresh();
    });
    assetsBox.appendChild(b);
  }
  const tileFrameBtn = document.createElement('button');
  tileFrameBtn.className = 'ed-thumb';
  tileFrameBtn.title = 'Tile atual como asset solto';
  tileFrameBtn.textContent = 'tile→asset';
  tileFrameBtn.style.fontSize = '8px';
  tileFrameBtn.addEventListener('click', () => {
    scene.setPropSrc({ kind: 'frame', frame: scene.getTileFrame() });
    scene.setTool('prop');
    refresh();
  });
  assetsBox.appendChild(tileFrameBtn);

  /* ----------------------------- ferramentas ---------------------------- */
  const toolsBox = $('#ed-tools');
  for (const t of TOOLS) {
    const b = document.createElement('button');
    b.textContent = t.label;
    b.dataset.tool = t.id;
    if (t.mineOnly) b.dataset.mineOnly = '1';
    b.addEventListener('click', () => {
      scene.setTool(t.id as ToolId);
      refresh();
    });
    toolsBox.appendChild(b);
  }

  /* --------------------------- fundo da arena --------------------------- */
  const bgLayersBox = $('#ed-bg-layers');
  const layerRows = new Map<string, { vis: HTMLInputElement; factor: HTMLInputElement; anchor: HTMLSelectElement; dy: HTMLInputElement }>();
  const buildLayerRows = (): void => {
    bgLayersBox.innerHTML = '';
    layerRows.clear();
    for (const layer of scene.getLayout().arena.bg) {
      const row = document.createElement('div');
      row.className = 'ed-row ed-layer';
      row.innerHTML = `
        <input type="checkbox" data-f="vis" />
        <span class="ed-layer-name">${BG_NAMES[layer.key] ?? layer.key}</span>
        <label>parallax <input type="number" data-f="factor" step="0.02" min="0" max="1" style="width:56px" /></label>
        <select data-f="anchor"><option value="full">céu</option><option value="veg">vegetação</option></select>
        <label>dy <input type="number" data-f="dy" step="2" style="width:52px" /></label>`;
      const get = <K extends HTMLElement>(f: string): K => row.querySelector(`[data-f="${f}"]`) as K;
      layerRows.set(layer.key, { vis: get('vis'), factor: get('factor'), anchor: get('anchor'), dy: get('dy') });
      const apply = (): void => {
        const target = scene.getLayout().arena.bg.find((l): l is BgLayerLayout => l.key === layer.key);
        if (!target) return;
        target.visible = layerRows.get(layer.key)!.vis.checked;
        target.factor = Number(layerRows.get(layer.key)!.factor.value);
        target.anchor = layerRows.get(layer.key)!.anchor.value as 'full' | 'veg';
        target.dy = Number(layerRows.get(layer.key)!.dy.value);
        scene.commitChange();
      };
      for (const input of row.querySelectorAll('input,select')) {
        input.addEventListener('change', apply);
      }
      bgLayersBox.appendChild(row);
    }
  };

  /* ------------------------------- refresh ------------------------------ */
  const refresh = (): void => {
    const layout = scene.getLayout();
    const tab = scene.getZoneTab();
    for (const b of root.querySelectorAll<HTMLButtonElement>('[data-zone]')) {
      b.classList.toggle('active', b.dataset.zone === tab);
    }
    for (const b of root.querySelectorAll<HTMLButtonElement>('[data-tool]')) {
      const mineOnly = b.dataset.mineOnly === '1';
      b.disabled = mineOnly && tab !== 'mine';
      b.classList.toggle('active', b.dataset.tool === scene.getTool());
    }
    for (const b of tilesBox.querySelectorAll<HTMLButtonElement>('[data-frame]')) {
      b.classList.toggle('active', Number(b.dataset.frame) === scene.getTileFrame());
    }
    const src = scene.getPropSrc();
    for (const b of assetsBox.querySelectorAll<HTMLButtonElement>('[data-key]')) {
      b.classList.toggle('active', src.kind === 'image' && b.dataset.key === src.key);
    }
    tileFrameBtn.classList.toggle('active', src.kind === 'frame');
    $('#ed-grid').checked = scene.getGrid();

    $('#ed-bg-sec').style.display = tab === 'arena' ? '' : 'none';
    $('#ed-mine-sec').style.display = tab === 'mine' ? '' : 'none';
    if (tab === 'arena') {
      $('#ed-sky').value = layout.arena.sky;
      for (const layer of layout.arena.bg) {
        const refs = layerRows.get(layer.key);
        if (!refs) continue;
        refs.vis.checked = layer.visible;
        refs.factor.value = String(layer.factor);
        refs.anchor.value = layer.anchor;
        refs.dy.value = String(layer.dy);
      }
    } else {
      $('#ed-m-sky').value = layout.mine.sky;
      $('#ed-m-sky2-on').checked = layout.mine.sky2 !== null;
      $('#ed-m-sky2').value = layout.mine.sky2 ?? '#1d1409';
      $('#ed-m-sky2').disabled = layout.mine.sky2 === null;
      $('#ed-m-posts').checked = layout.mine.posts;
      $('#ed-m-ceilh').value = String(layout.mine.ceiling?.cropH ?? 26);
    }
    const lz = tab === 'arena' ? layout.arena : layout.mine;
    $('#ed-g-croph').value = String(lz.ground.cropH);
    $('#ed-g-fill').value = lz.ground.fill;

    const sel = scene.getSelected();
    const selBody = $('#ed-sel-body');
    if (!sel) {
      selBody.innerHTML = '<div class="ed-muted">nada selecionado — use "Selecionar/mover" ou coloque um asset</div>';
    } else {
      const name = sel.src.kind === 'image' ? sel.src.key : `tile #${sel.src.frame}`;
      selBody.innerHTML = `
        <div class="ed-muted">${name} (id ${sel.id})</div>
        <label class="ed-row">posição x (0-1) <input type="number" data-p="fx" step="0.01" min="-0.25" max="1.25" style="width:70px" /></label>
        <label class="ed-row">altura vs chão <input type="number" data-p="dy" step="1" style="width:70px" /></label>
        <label class="ed-row">escala <input type="number" data-p="scale" step="0.1" min="0.1" max="12" style="width:70px" /></label>
        <label class="ed-row">profundidade <input type="number" data-p="depth" step="1" min="-9" max="60" style="width:70px" /></label>
        <label class="ed-row">opacidade <input type="number" data-p="alpha" step="0.05" min="0" max="1" style="width:70px" /></label>
        <label class="ed-row"><input type="checkbox" data-p="flipX" /> espelho horizontal
          <input type="checkbox" data-p="flipY" /> espelho vertical</label>
        <div class="ed-btns"><button data-act="del-prop">Remover asset</button></div>`;
      const set = (patch: Record<string, unknown>): void => scene.updateSelected(patch);
      for (const input of selBody.querySelectorAll<HTMLInputElement>('[data-p]')) {
        const field = input.dataset.p!;
        if (field === 'flipX') input.checked = sel.flipX;
        else if (field === 'flipY') input.checked = sel.flipY;
        else input.value = String(sel[field as 'fx' | 'dy' | 'scale' | 'depth' | 'alpha']);
        input.addEventListener('input', () => {
          if (field === 'flipX' || field === 'flipY') set({ [field]: input.checked });
          else set({ [field]: Number(input.value) });
        });
      }
      selBody.querySelector('[data-act="del-prop"]')?.addEventListener('click', () => scene.removeSelected());
    }
  };

  /* ------------------------------- eventos ------------------------------ */
  root.querySelector('[data-zone="arena"]')?.addEventListener('click', () => scene.setZoneTab('arena'));
  root.querySelector('[data-zone="mine"]')?.addEventListener('click', () => scene.setZoneTab('mine'));
  $('#ed-grid').addEventListener('change', (e) => scene.setGrid((e.target as HTMLInputElement).checked));

  $('#ed-sky').addEventListener('input', (e) => {
    scene.getLayout().arena.sky = (e.target as HTMLInputElement).value;
    scene.commitChange();
  });
  $('#ed-m-sky').addEventListener('input', (e) => {
    scene.getLayout().mine.sky = (e.target as HTMLInputElement).value;
    scene.commitChange();
  });
  $('#ed-m-sky2-on').addEventListener('change', (e) => {
    const on = (e.target as HTMLInputElement).checked;
    scene.getLayout().mine.sky2 = on ? $('#ed-m-sky2').value : null;
    scene.commitChange();
    refresh();
  });
  $('#ed-m-sky2').addEventListener('input', (e) => {
    scene.getLayout().mine.sky2 = (e.target as HTMLInputElement).value;
    scene.commitChange();
  });
  $('#ed-m-posts').addEventListener('change', (e) => {
    scene.getLayout().mine.posts = (e.target as HTMLInputElement).checked;
    scene.commitChange();
  });
  $('#ed-m-ceilh').addEventListener('change', (e) => {
    const mine = scene.getLayout().mine;
    if (!mine.ceiling) mine.ceiling = { cells: [], cropH: 26 };
    mine.ceiling.cropH = Number((e.target as HTMLInputElement).value);
    scene.commitChange();
  });
  $('#ed-g-croph').addEventListener('change', (e) => {
    const lz = scene.getZoneTab() === 'arena' ? scene.getLayout().arena : scene.getLayout().mine;
    lz.ground.cropH = Number((e.target as HTMLInputElement).value);
    scene.commitChange();
  });
  $('#ed-g-fill').addEventListener('input', (e) => {
    const lz = scene.getZoneTab() === 'arena' ? scene.getLayout().arena : scene.getLayout().mine;
    lz.ground.fill = (e.target as HTMLInputElement).value;
    scene.commitChange();
  });

  const goGame = (): void => {
    scene.persist();
    window.location.hash = '';
    window.location.reload();
  };
  root.addEventListener('click', (e) => {
    const act = (e.target as HTMLElement).dataset?.act;
    if (!act) return;
    if (act === 'save') {
      scene.persist();
      toast('Layout salvo neste navegador');
    } else if (act === 'play' || act === 'back') {
      goGame();
    } else if (act === 'reset') {
      clearLayout();
      scene.setLayout(defaultLayout());
      buildLayerRows();
      refresh();
      toast('Layout padrão restaurado');
    } else if (act === 'export') {
      const blob = new Blob([JSON.stringify(scene.getLayout(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'akai-scene-layout.json';
      a.click();
      URL.revokeObjectURL(a.href);
      toast('JSON exportado');
    } else if (act === 'import') {
      $('#ed-file').click();
    }
  });
  $('#ed-file').addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    void file.text().then((text) => {
      const parsed = parseLayout(JSON.parse(text) as unknown);
      if (!parsed) {
        toast('JSON inválido: layout recusado');
        return;
      }
      scene.setLayout(parsed);
      saveLayout(parsed);
      buildLayerRows();
      refresh();
      toast('Layout importado');
    });
  });

  scene.onChanged = () => refresh();
  scene.onSelection = () => refresh();
  buildLayerRows();
  refresh();
};
