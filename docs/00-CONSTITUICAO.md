# 00 — CONSTITUIÇÃO DO PROJETO AKAI

**Autoridade: MÁXIMA.** Este documento está acima de GDD, ARCHITECTURE, ROADMAP e
de qualquer decisão ad-hoc. Conflitos são resolvidos aqui; mudanças em regras
deste documento exigem registro em `docs/ADR/` e atualização de `AI_STATE.md`.

Referência obrigatória: `docs/master-prompt.md` (especificação original).
Hierarquia documental: `master-prompt.md` → `00-CONSTITUICAO.md` → GDD →
ARCHITECTURE/API/DATA_MODEL/SECURITY → BALANCE/ECONOMY/DROP_TABLES →
ROADMAP/TEST_PLAN → `AI_STATE.md` (estado factual, não normativo).

## 1. Visão do produto

Projeto Akai é um **Idle RPG Clicker 2D, mobile-first, vertical**, de fantasia
medieval, jogável no navegador e preparada para empacotamento Android.
O jogador combina **mineração ativa por clique**, **combate automático em torre
de 1.000 andares** e **automação progressiva de recursos**.

## 2. Público e plataformas

- Primário: jogadores mobile de idle/clicker RPG (sessões curtas e retornos).
- Plataformas: navegadores desktop/mobile hoje; Android (Capacitor ou
  equivalente) após validação de desempenho (Fase 9 do ROADMAP).
- Classificação etária alvo: livre/10+; sem chat aberto no MVP.

## 3. Pilares de gameplay

1. **Clique gratificante**: o ciclo inicial de mineração de ferro deve responder
   em menos de 100 ms com feedback visual claro.
2. **Combate que se assiste**: batalha automática legível, lateral, com progresso
   perceptível sem input.
3. **Automação como recompensa**: cada mina desbloqueada reduz dependência de
   clique e abre novo loop de decisão.
4. **Progressão longa e escalável**: 1.000 andares com reuso inteligente de
   assets, nunca mil conjuntos exclusivos.
5. **Economia confiável**: nenhum recurso existe sem origem validada.

## 4. Regras inegociáveis

1. 2D, mobile-first, vertical; desktop é acomodação, não redesign.
2. Três áreas na tela principal: combate (topo), mineração (meio), automações
   (base). Nenhuma vira dashboard.
3. Combate automático; o jogador influencia por melhorias/equipamentos/mascotes.
4. Ferro é o recurso central do início; 1 ferro/clique no nível 1.
5. Servidor é a única autoridade sobre economia, combate, progressão e
   recompensas no modo online. Cliente nunca envia saldo, dano, drop ou
   resultado de batalha como verdade.
6. Cliente e servidor são aplicativos independentes com contratos versionados
   (`packages/shared`).
7. Assets reais do repositório são a base visual. É proibido substituir sprite
   disponível por emoji, retângulo ou imagem gerada sem justificativa registrada.
8. Nada é declarado concluído sem regra documentada, código, testes e
   persistência (master-prompt §34).
9. Sem segredos no repositório; sem endpoint administrativo público; sem modo
   debug ativável por URL em produção.
10. Licenças de assets devem estar confirmadas antes de qualquer lançamento
    comercial; até lá, status `pending-verification`.

## 5. Direção visual

Fantasia medieval pixel-art coesa. Leitura lateral dos combatentes. Fundos em
camadas com parallax discreto que não disputem atenção. Ícones 32x32 da série
Icon31 para recursos. Detalhes em `docs/art/ART_BIBLE.md`.

## 6. Princípios de segurança

- Confiança zero no cliente para valores econômicos ou competitivos.
- Rate limit, idempotência e transações atômicas para toda movimentação.
- Auditoria de emissão de moeda premium (ruby) e de ações administrativas.
- Detalhes e threat model em `docs/SECURITY.md`.

## 7. Monetização

- Ruby é moeda premium; emissão somente por compra validada, evento ou
  anúncio recompensado verificado pelo servidor.
- Anúncios sempre voluntários, nunca interrompem combate, recompensa idempotente.
- Sem pay-to-win competitivo prometido antes de simulações (Fase 8/10).
- Pacotes de ruby em 4 categorias (Punhado, Saco, Pote, Baú) com preços
  indefinidos até simulação de economia.

## 8. Limites técnicos

- Dispositivos Android de entrada como piso de desempenho.
- Um canvas Phaser principal; UI de listas/painéis em HTML acessível.
- Sem atualização de banco por frame; sem mensagens de rede por animação local.
- Assets originais nunca são reexportados destrutivamente; derivados apenas
  documentados (master-prompt §3.2).

## 9. Procedimento de mudança de escopo

1. Proposta registrada como ADR com alternativas e consequências.
2. Impacto em ROADMAP (fase, dependência, critério de aceite) atualizado.
3. `AI_STATE.md` atualizado com decisão aprovada ou pendente.
4. Se tocar regra inegociável: alterar este arquivo explicitamente no mesmo
   commit, citando o ADR.
