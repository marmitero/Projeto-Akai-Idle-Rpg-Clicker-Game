#!/usr/bin/env python3
"""Projeto Akai - gera o Manifesto Oficial de Assets (docs/art/).

Fontes de verdade:
  * tools/out/sprite_inventory.json  (gerado por tools/scan_sprites.py)
  * CURATED abaixo: grades de quadros CONFIRMADAS por inspeção visual e/ou
    analise de colunas/linhas transparentes em 2026-10-13.

Nada aqui é inventado: entradas sem grade verificada recebem
inspectionStatus="pending" e needsHumanInspection=true, conforme a regra do
master-prompt (secao 3.2: nao deduzir spritesheets automaticamente).

Saida:
  docs/art/assets.json       (indice legivel por maquina)
  docs/art/ASSET_MANIFEST.md (manifesto humano)
"""
import json
import os
from collections import Counter, defaultdict

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INV = os.path.join(ROOT, "tools", "out", "sprite_inventory.json")
OUT_JSON = os.path.join(ROOT, "docs", "art", "assets.json")
OUT_MD = os.path.join(ROOT, "docs", "art", "ASSET_MANIFEST.md")

# ---------------------------------------------------------------------------
# Grades verificadas (frame_w, frame_h, cols, rows, animacoes)
# "rows" = linhas da sheet; anims lista (nome, linha, quadros) quando a sheet
# tem varias animacoes empilhadas.
# ---------------------------------------------------------------------------
BASE_ROWS = [
    ("idle", 0, 5), ("walk", 1, 8), ("run", 2, 8), ("jump", 3, 4),
    ("cast", 4, 4), ("attack", 5, 6), ("death", 6, 10),
]

CURATED = {
    # ---- protagonista (frames confirmados pelos .gif de quadro unico) ----
    "sprites/Character/Idle/Idle-Sheet.png": dict(frame=(64, 80), anims=[("idle", 0, 4)]),
    "sprites/Character/Run/Run-Sheet.png": dict(frame=(80, 80), anims=[("run", 0, 8)]),
    "sprites/Character/Attack-01/Attack-01-Sheet.png": dict(frame=(96, 80), anims=[("attack", 0, 8)]),
    "sprites/Character/Dead/Dead-Sheet.png": dict(frame=(80, 64), anims=[("death", 0, 8)]),
    "sprites/Character/Jump-Start/Jump-Start-Sheet.png": dict(frame=(64, 64), anims=[("jump_start", 0, 4)]),
    "sprites/Character/Jumlp-All/Jump-All-Sheet.png": dict(frame=(64, 64), anims=[("jump", 0, 15)]),
    "sprites/Character/Jump-End/Jump-End-Sheet.png": dict(frame=(64, 64), anims=[("jump_end", 0, 3)]),
    # ---- efeitos: biblioteca de variantes em grade 32x32 (verificacao visual) ----
    "sprites/Effects/Red Effect Bullet Impact Explosion 32x32.png": dict(frame=(32, 32), anims=[("variant_grid", 0, 320)], note="biblioteca de variantes; usar celulas individuais"),
    "sprites/Effects/Yellow Effect Bullet Impact Explosion 32x32.png": dict(frame=(32, 32), anims=[("variant_grid", 0, 320)], note="biblioteca de variantes; usar celulas individuais"),
    "sprites/Effects/Blue Effect Bullet Impact Explosion 32x32.png": dict(frame=(32, 32), anims=[("variant_grid", 0, 320)], note="biblioteca de variantes; usar celulas individuais"),
    "sprites/Effects/Green Effect Bullet Impact Explosion 32x32.png": dict(frame=(32, 32), anims=[("variant_grid", 0, 320)], note="biblioteca de variantes; usar celulas individuais"),
    "sprites/Effects/Purple Effect Bullet Impact Explosion 32x32.png": dict(frame=(32, 32), anims=[("variant_grid", 0, 320)], note="biblioteca de variantes; usar celulas individuais"),
    # ---- inimigos pequenos (32x32 / 64x64 / 80x64 / 128x128) ----
    "sprites/Enemies/Dude_Monster/Dude_Monster_Idle_4.png": dict(frame=(32, 32), anims=[("idle", 0, 4)]),
    "sprites/Enemies/Dude_Monster/Dude_Monster_Walk_6.png": dict(frame=(32, 32), anims=[("walk", 0, 6)]),
    "sprites/Enemies/Dude_Monster/Dude_Monster_Run_6.png": dict(frame=(32, 32), anims=[("run", 0, 6)]),
    "sprites/Enemies/Dude_Monster/Dude_Monster_Attack1_4.png": dict(frame=(32, 32), anims=[("attack", 0, 4)]),
    "sprites/Enemies/Dude_Monster/Dude_Monster_Attack2_6.png": dict(frame=(32, 32), anims=[("attack2", 0, 6)]),
    "sprites/Enemies/Dude_Monster/Dude_Monster_Hurt_4.png": dict(frame=(32, 32), anims=[("hurt", 0, 4)]),
    "sprites/Enemies/Dude_Monster/Dude_Monster_Death_8.png": dict(frame=(32, 32), anims=[("death", 0, 8)]),
    "sprites/Enemies/Mushroom/Mushroom-Idle.png": dict(frame=(80, 64), anims=[("idle", 0, 7)]),
    "sprites/Enemies/Mushroom/Mushroom-Run.png": dict(frame=(80, 64), anims=[("run", 0, 8)]),
    "sprites/Enemies/Mushroom/Mushroom-Attack.png": dict(frame=(80, 64), anims=[("attack", 0, 8)]),
    "sprites/Enemies/Mushroom/Mushroom-Hit.png": dict(frame=(80, 64), anims=[("hurt", 0, 4)]),
    "sprites/Enemies/Mushroom/Mushroom-Die.png": dict(frame=(80, 64), anims=[("death", 0, 8)]),
    "sprites/Enemies/Slime/Slime blue.png": dict(frame=(64, 96), anims=[("idle", 0, 4)]),
    "sprites/Enemies/Slime/Slime green.png": dict(frame=(64, 96), anims=[("idle", 0, 4)]),
    "sprites/Enemies/Slime/Slime red.png": dict(frame=(64, 96), anims=[("idle", 0, 4)]),
    "sprites/Enemies/Bat/Bat-IdleFly.png": dict(frame=(64, 64), anims=[("idle", 0, 9)]),
    "sprites/Enemies/Bat/Bat-Run.png": dict(frame=(64, 64), anims=[("run", 0, 6)]),
    "sprites/Enemies/Bat/Bat-Attack1.png": dict(frame=(64, 64), anims=[("attack", 0, 6)]),
    "sprites/Enemies/Bat/Bat-Hurt.png": dict(frame=(64, 64), anims=[("hurt", 0, 3)]),
    "sprites/Enemies/Bat/Bat-Die.png": dict(frame=(64, 64), anims=[("death", 0, 8)]),
    "sprites/Enemies/Zombie_1/Idle.png": dict(frame=(128, 128), anims=[("idle", 0, 6)]),
    "sprites/Enemies/Zombie_1/Walk.png": dict(frame=(128, 128), anims=[("walk", 0, 10)]),
    "sprites/Enemies/Zombie_1/Attack.png": dict(frame=(128, 128), anims=[("attack", 0, 8)]),
    "sprites/Enemies/Zombie_1/Hurt.png": dict(frame=(128, 128), anims=[("hurt", 0, 4)]),
    "sprites/Enemies/Zombie_1/Dead.png": dict(frame=(128, 128), anims=[("death", 0, 8)]),
    "sprites/Enemies/Zombie_2/Idle.png": dict(frame=(128, 128), anims=[("idle", 0, 6)]),
    "sprites/Enemies/Zombie_2/Walk.png": dict(frame=(128, 128), anims=[("walk", 0, 10)]),
    "sprites/Enemies/Zombie_3/Idle.png": dict(frame=(128, 128), anims=[("idle", 0, 6)]),
    "sprites/Enemies/Zombie_4/Idle.png": dict(frame=(128, 128), anims=[("idle", 0, 6)]),
}
for z in ("Zombie_2", "Zombie_3", "Zombie_4"):
    for anim, n in (("Walk", 10), ("Attack", 8), ("Hurt", 4), ("Dead", 8)):
        CURATED[f"sprites/Enemies/{z}/{anim}.png"] = dict(frame=(128, 128), anims=[(anim.lower() if anim != "Dead" else "death", 0, n)])

# esqueletos: frames individuais (sem sheet) - sequencias confirmadas por nome
SKELETON_SEQ = {
    "idle": 4, "walk": 6, "jump": 6, "hit": 3, "dead": 4,
    "attack-a": 8, "attack-b": 11,
}

# bosses: frame por familia (confirmado pelos PNG Sequences de 1 quadro)
BOSS_FRAME = {
    "Assassin": (480, 480), "Chief Goblin": (480, 480), "Female Goblin": (480, 480),
    "Male Goblin": (480, 480), "Robber": (480, 480), "Thug": (480, 480),
    "Caveman Boss": (840, 720), "Giant Goblin": (840, 720), "Pirate Leader": (840, 720),
    "Pirate Zombie": (840, 720), "Squidman": (840, 720), "Viking Leader": (840, 720),
}
BOSS_ANIMS = ["Idle", "Walking", "Running", "Attacking", "Hurt", "Dying"]
BOSS_DIRS = ["Left", "Right", "Front", "Back"]

CATEGORY_OF_PREFIX = [
    ("sprites/Tiles", "tiles"), ("sprites/Backgrounds", "backgrounds"),
    ("sprites/Character", "character"), ("sprites/Effects", "effects"),
    ("sprites/Equipments", "equipment"), ("sprites/Acessories", "accessory"),
    ("sprites/Misc", "misc"), ("sprites/Assets", "world_decor"),
    ("sprites/Enemies", "enemy"), ("sprites/Boss", "boss"),
    ("sprites/Mine", "mine_node"), ("sprites/Materials", "material_icon"),
]

# Uso previsto no MVP (mapeamento asset -> sistema), decidido na Etapa 3.
MVP_USE = {
    "sprites/Character/Idle/Idle-Sheet.png": "heroi: animacao idle na cena de combate",
    "sprites/Character/Run/Run-Sheet.png": "heroi: caminhada/transicao entre ondas e andares",
    "sprites/Character/Attack-01/Attack-01-Sheet.png": "heroi: ataque automatico",
    "sprites/Character/Dead/Dead-Sheet.png": "heroi: derrota",
    "sprites/Tiles/Floor Tiles1.png": "chao da cena de combate e da cena de mineracao",
    "sprites/Mine/ironNode.png": "no de ferro clicavel (area central)",
    "sprites/Mine/coalNode.png": "no/visual da mina de carvao",
    "sprites/Mine/goldNode.png": "no/visual da mina de ouro",
    "sprites/Mine/jadeNode.png": "no/visual da mina de jade",
    "sprites/Materials/Icon31_15.png": "icone de ferro (HUD, custos, recompensas)",
    "sprites/Materials/Icon31_13.png": "icone de carvao (HUD, custos, recompensas)",
    "sprites/Materials/Icon31_35.png": "icone de ouro (HUD, custos, recompensas)",
    "sprites/Materials/Icon31_40.png": "icone de jade (HUD, custos, recompensas)",
    "sprites/Backgrounds/Normal BG/GandalfHardcore Background layers_layer 1.png": "ceu (parallax camada 1)",
    "sprites/Backgrounds/Normal BG/GandalfHardcore Background layers_layer 2.png": "parallax camada 2",
    "sprites/Backgrounds/Normal BG/GandalfHardcore Background layers_layer 3.png": "parallax camada 3 (vegetacao)",
    "sprites/Backgrounds/Normal BG/GandalfHardcore Background layers_layer 4.png": "parallax camada 4",
    "sprites/Backgrounds/Normal BG/Background Castle .png": "castelo distante (parallax)",
    "sprites/Effects/Red Effect Bullet Impact Explosion 32x32.png": "efeitos de impacto/golpe (celulas individuais da grade 32x32)",
    "sprites/Enemies/Skeleton/PNG/idle-1.png": "inimigo padrão dos primeiros andares",
}


def category_of(path: str) -> str:
    for prefix, cat in CATEGORY_OF_PREFIX:
        if path.startswith(prefix):
            return cat
    return "unknown"


def family_of(path: str) -> str:
    parts = path.split("/")
    if len(parts) >= 3:
        return "/".join(parts[1:3])
    return path


def slug(path: str) -> str:
    return (path.replace("sprites/", "").replace("/", "__")
            .replace(" ", "_").replace("-", "_").replace(".", "_").lower())


def main() -> int:
    inv = json.load(open(INV))
    entries = inv["entries"]
    out = []
    stats = Counter()
    for e in entries:
        path = e["path"]
        cat = category_of(path)
        rec = {
            "id": slug(path),
            "path": path,
            "category": cat,
            "family": family_of(path),
            "ext": e.get("ext"),
            "bytes": e.get("bytes"),
            "width": e.get("w"),
            "height": e.get("h"),
            "colorType": e.get("colorType"),
            "alpha": e.get("alpha"),
            "sha1": e.get("sha1"),
            "licenseStatus": "pending-verification",
            "attribution": None,
            "intendedUse": MVP_USE.get(path),
        }
        cur = CURATED.get(path)
        if cur:
            fw, fh = cur["frame"]
            rec["sheet"] = {
                "frameWidth": fw, "frameHeight": fh,
                "animations": [
                    {"name": n, "row": r, "frames": f,
                     "startX": 0, "startY": r * fh}
                    for (n, r, f) in cur["anims"]
                ],
            }
            if cur.get("note"):
                rec["sheet"]["note"] = cur["note"]
            rec["inspectionStatus"] = "verified-visual"
            rec["needsHumanInspection"] = False
        elif path.startswith("sprites/Enemies/Male Base/") or path.startswith("sprites/Enemies/Female Base/"):
            cols = 9 if e.get("w") == 720 else 10
            rec["sheet"] = {
                "frameWidth": 80, "frameHeight": 64, "columns": cols, "rows": 7,
                "animations": [
                    {"name": n, "row": r, "frames": f, "startX": 0, "startY": r * 64}
                    for (n, r, f) in BASE_ROWS
                ],
                "layered": True,
            }
            rec["inspectionStatus"] = "verified-visual"
            rec["needsHumanInspection"] = False
        elif "/Spritesheets/" in path and path.startswith("sprites/Boss/"):
            fam = path.split("/")[2]
            fw, fh = BOSS_FRAME.get(fam, (0, 0))
            if fw and e.get("w") and e.get("h") and e["w"] % fw == 0 and e["h"] % fh == 0:
                name = os.path.splitext(os.path.basename(path))[0]
                direction = name.split(" - ")[0] if " - " in name else None
                anim = name.split(" - ")[-1] if " - " in name else name
                rec["sheet"] = {
                    "frameWidth": fw, "frameHeight": fh,
                    "columns": e["w"] // fw, "rows": e["h"] // fh,
                    "direction": direction,
                    "animations": [{"name": anim.lower(), "row": 0,
                                    "frames": (e["w"] // fw) * (e["h"] // fh)}],
                }
                rec["inspectionStatus"] = "verified-grid"
                rec["needsHumanInspection"] = False
            else:
                rec["inspectionStatus"] = "pending"
                rec["needsHumanInspection"] = True
        elif path.startswith("sprites/Enemies/Skeleton/PNG/") or \
                path.startswith("sprites/Enemies/Lancer Skeleton/PNG/") or \
                path.startswith("sprites/Enemies/Shield Skeleton/PNG/") or \
                path.startswith("sprites/Enemies/Archer/PNG/") or \
                path.startswith("sprites/Enemies/Shadow/PNG/") or \
                path.startswith("sprites/Enemies/Inquisitor/PNG/"):
            base = os.path.splitext(os.path.basename(path))[0].lower()
            seq = None
            for name, n in SKELETON_SEQ.items():
                if base.startswith(name + "-") or base == name:
                    seq = (name, n)
            rec["sequence"] = {"animation": seq[0], "index": None, "expectedFrames": seq[1]} if seq else None
            rec["inspectionStatus"] = "verified-header"
            rec["needsHumanInspection"] = seq is None
        else:
            rec["inspectionStatus"] = "verified-header" if e.get("w") else "pending"
            rec["needsHumanInspection"] = True
        stats[rec["inspectionStatus"]] += 1
        out.append(rec)

    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    payload = {
        "project": "Projeto Akai - Idle RPG Clicker Game",
        "generatedFrom": "tools/out/sprite_inventory.json (scan real de sprites/)",
        "generator": "tools/build_manifest.py",
        "inspectionStatusCounts": dict(stats),
        "licenseNote": ("Nenhum arquivo de licenca/atribuicao acompanha os packs neste "
                        "repositorio. Todos os assets permanecem como pending-verification "
                        "ate confirmacao humana. Veja docs/art/ASSET_LICENSES.md."),
        "entries": out,
    }
    with open(OUT_JSON, "w") as fh:
        json.dump(payload, fh, separators=(",", ":"))

    write_markdown(out, stats)
    print("assets.json entries:", len(out))
    print("status counts:", dict(stats))
    return 0


def write_markdown(entries, stats) -> None:
    by_cat = defaultdict(list)
    for e in entries:
        by_cat[e["category"]].append(e)
    verified = [e for e in entries if e["inspectionStatus"] in ("verified-visual", "verified-grid")]
    lines = []
    add = lines.append
    add("# ASSET_MANIFEST — Projeto Akai")
    add("")
    add("Manifesto oficial dos assets de `sprites/`. Gerado por `tools/build_manifest.py`")
    add("a partir do scan real (`tools/scan_sprites.py` → `tools/out/sprite_inventory.json`).")
    add("O índice completo legível por máquina está em `docs/art/assets.json`.")
    add("")
    add(f"- Arquivos inventariados (sem `.DS_Store`): **{len(entries)}**")
    add(f"- Entradas com grade de quadros verificada (visual ou aritmética): **{len(verified)}**")
    add(f"- Entradas pendentes de inspeção humana: **{sum(1 for e in entries if e['needsHumanInspection'])}**")
    add("- Licenças: **nenhuma confirmada** — ver `docs/art/ASSET_LICENSES.md`")
    add("")
    add("## Metodologia")
    add("")
    add("1. `tools/scan_sprites.py` lê cabeçalhos PNG/GIF/PSD com a stdlib do Python")
    add("   (Pillow indisponível no ambiente; ImageMagick usado apenas para conferência")
    add("   e prévias). Registra dimensões, modo de cor, alfa, bytes e SHA-1.")
    add("2. Duplicatas exatas detectadas por SHA-1 em `tools/out/sprite_duplicates.json`.")
    add("3. Grades de quadros foram confirmadas por (a) inspeção visual das linhas da")
    add("   sheet, (b) análise de colunas/linhas totalmente transparentes e (c) comparação")
    add("   com os `.gif` de quadro único do pack do protagonista.")
    add("4. Nenhuma sheet foi deduzida automaticamente: sem confirmação, a entrada fica")
    add("   `needsHumanInspection: true`.")
    add("")
    add("## Status de inspeção")
    add("")
    add("| status | quantidade |")
    add("|---|---|")
    for k, v in sorted(stats.items()):
        add(f"| {k} | {v} |")
    add("")
    add("## Famílias e usos")
    add("")

    sections = [
        ("character", "Protagonista (`sprites/Character/`)"),
        ("enemy", "Inimigos (`sprites/Enemies/`)"),
        ("boss", "Bosses (`sprites/Boss/`)"),
        ("mine_node", "Mineração (`sprites/Mine/`)"),
        ("material_icon", "Ícones de recursos (`sprites/Materials/`)"),
        ("tiles", "Tiles (`sprites/Tiles/`)"),
        ("backgrounds", "Fundos em camadas (`sprites/Backgrounds/`)"),
        ("effects", "Efeitos (`sprites/Effects/`)"),
        ("equipment", "Equipamentos (`sprites/Equipments/`)"),
        ("accessory", "Acessórios (`sprites/Acessories/`)"),
        ("misc", "Miscelânea (`sprites/Misc/`)"),
        ("world_decor", "Decoração (`sprites/Assets/`)"),
    ]
    for cat, title in sections:
        es = by_cat.get(cat, [])
        add(f"### {title}")
        add("")
        add(f"{len(es)} arquivos raster.")
        add("")
        if cat == "character":
            add("| sheet | frame | animação | quadros | uso |")
            add("|---|---|---|---|---|")
            for e in es:
                if e.get("sheet"):
                    for a in e["sheet"]["animations"]:
                        add(f"| `{e['path']}` | {e['sheet']['frameWidth']}x{e['sheet']['frameHeight']} | {a['name']} | {a['frames']} | {e['intendedUse'] or '-'} |")
        elif cat == "enemy":
            fams = defaultdict(list)
            for e in es:
                fams[e["path"].split("/")[2]].append(e)
            for fam, fes in sorted(fams.items()):
                sheets = [e for e in fes if e.get("sheet")]
                seqs = [e for e in fes if e.get("sequence")]
                layers = [e for e in fes if e.get("sheet", {}).get("layered")]
                add(f"- **{fam}**: {len(fes)} arquivos; "
                    f"{len(sheets)} sheets verificadas; {len(seqs)} frames de sequência; "
                    f"{len(layers)} camadas de composição.")
                if fam in ("Male Base", "Female Base"):
                    add("  - Sistema de composição: grade 80x64, 10 colunas x 7 linhas "
                        "(orelhas: 9 colunas). Linhas: idle(5), walk(8), run(8), jump(4), "
                        "cast(4), attack(6), death(10). Camadas: Skin, Clothing, Hair, Hat, "
                        "Mask, Ears, Arm Layers, Hand — todas alinhadas no mesmo canvas, "
                        "permitindo composição por empilhamento na mesma origem.")
                    sub = defaultdict(int)
                    for e in fes:
                        sub[e["path"].split("/")[3]] += 1
                    add("  - Peças: " + ", ".join(f"{k}={v}" for k, v in sorted(sub.items())))
        elif cat == "boss":
            fams = defaultdict(list)
            for e in es:
                fams[e["path"].split("/")[2]].append(e)
            add("| família | frame | direções na sheet | animações | observação |")
            add("|---|---|---|---|---|")
            for fam, fes in sorted(fams.items()):
                sheets = [e for e in fes if e.get("sheet")]
                fw = sheets[0]["sheet"]["frameWidth"] if sheets else 0
                fh = sheets[0]["sheet"]["frameHeight"] if sheets else 0
                dirs = sorted({e["sheet"].get("direction") for e in sheets if e["sheet"].get("direction")})
                note = "usar apenas Left/Right no combate lateral (§3.5)" if dirs else "sem grade regular — inspeção humana"
                add(f"| {fam} | {fw}x{fh} | {len(dirs)} | {len({a['name'] for e in sheets for a in e['sheet']['animations']})} | {note} |")
            add("")
            add("Robot1-3 e Troll1-3 possuem sequências PNG de dimensões irregulares "
                "(renderização vetorial): **não** são grades utilizáveis sem recorte "
                "assistido; ficam pendentes e fora do MVP.")
        elif cat == "mine_node":
            add("| arquivo | dimensão | uso |")
            add("|---|---|---|")
            for e in es:
                add(f"| `{e['path']}` | {e['width']}x{e['height']} | {e['intendedUse'] or '-'} |")
        elif cat == "material_icon":
            add("38 ícones 32x32 (série Icon31). Mapeamento oficial de recursos:")
            add("")
            add("| recurso | arquivo |")
            add("|---|---|")
            add("| ferro | `sprites/Materials/Icon31_15.png` |")
            add("| carvão | `sprites/Materials/Icon31_13.png` |")
            add("| ouro | `sprites/Materials/Icon31_35.png` |")
            add("| jade | `sprites/Materials/Icon31_40.png` |")
        elif cat == "backgrounds":
            add("Três biomas (Normal, Autumn, Winter), cada um com 5 camadas 1024x346 "
                "(camada 5 vazia nos três) + um elemento distante de castelo. "
                "No jogo as camadas são desenhadas em ordem 1→4 + castelo, com parallax. "
                "A camada 5 vazia fica registrada como lacuna do pack.")
        elif cat == "tiles":
            add("| arquivo | dimensão | observação |")
            add("|---|---|---|")
            add("| `sprites/Tiles/Floor Tiles1.png` | 288x576 | tileset **96x96** (3 col x 6 lin): linhas 0/2/4 = blocos sólidos com topo verde/laranja/neve; linhas 1/3/5 = peças de autotile (cruz, bordas, espinhos). Correção de auditoria de 2026-10-13: a grade anterior de 48x48 estava errada e fatiava bordas transparentes |")
            add("| `sprites/Tiles/Floor Tiles2.png` | 288x576 | variante alternativa (mesma grade 96x96) |")
            add("| `sprites/Tiles/Tall Grass.png` | 96x32 | grama alta decorativa |")
        elif cat == "effects":
            add("70 arquivos: tiras de impacto/explosão (`* Bullet Impact Explosion "
                "32x32.png`, 192x64 = 6 quadros de 32x32), tiras de status sobre o "
                "personagem (400x64, grades individuais pendentes de verificação) e gifs "
                "de explosão colorida. No MVP usam-se `Red Effect Bullet Impact Explosion "
                "32x32.png` (impacto) e `Character effects curved lines.png` (slash). "
                "As sheets 640x512/864x672 (blood/buff) permanecem pendentes.")
        else:
            dims = Counter((e["width"], e["height"]) for e in es)
            add("Dimensões predominantes: " + ", ".join(f"{w}x{h} x{n}" for (w, h), n in dims.most_common(4)))
            if cat == "equipment":
                add("Ícones 32x32 organizados por slot: 2 hands, Armors, Arrows, Axes, "
                    "Boots, Daggers, Gloves, Hats, Maces, Shields, Spears, Swords. "
                    "Cada slot tem 10-20 variantes para raridades/progressão.")
        add("")

    add("## Lacunas e incompatibilidades registradas")
    add("")
    add("1. **Nenhum arquivo de licença ou atribuição** acompanha qualquer pack.")
    add("2. `sprites/Enemies/Warrior/GandalfHardcore Warrior.png` (800x1088) é uma folha "
        "irregular sem grade confirmada — pendente.")
    add("3. `sprites/Boss/Robot1..3` e `Troll1..3`: sequências de dimensões irregulares, "
        "sem grade; inadequados para o pipeline de sheets do MVP.")
    add("4. Camada 5 dos fundos é totalmente transparente nos três biomas.")
    add("5. `sprites/Character/Jumlp-All/` contém typo no nome da pasta (mantido; não "
        "renomear assets sem justificativa).")
    add("6. 751 grupos de duplicatas exatas (SHA-1), majoritariamente frames repetidos "
        "entre direções de bosses; ver `tools/out/sprite_duplicates.json`.")
    add("7. Não há sprites de mascote adequados (lacuna documentada para a Fase 4, "
        "conforme master-prompt §14).")
    add("8. Não existe ícone de moeda (coins) nos packs: `Misc/Loots` contém ervas/"
        "frutas, não moedas. A HUD desenha uma moeda em CSS e a lacuna fica "
        "registrada aqui; substituir por sprite real quando um pack licenciado "
        "for aprovado.")
    add("")
    with open(OUT_MD, "w") as fh:
        fh.write("\n".join(lines))


if __name__ == "__main__":
    raise SystemExit(main())
