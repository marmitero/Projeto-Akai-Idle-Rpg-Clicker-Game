import { CONTRACT_VERSION, type GameEvent, type PlayerState } from '@akai/shared';
import { newActionId, type Driver, DriverHandlers, UiIntent } from './driver.js';

const SESSION_KEY = 'akai.session.v1';

interface ServerStateMsg {
  v: number;
  t: 'state';
  rev: number;
  state: PlayerState;
  events: GameEvent[];
}
interface ServerErrorMsg {
  v: number;
  t: 'error';
  code: string;
  message: string;
  actionId?: string;
}

/**
 * Modo online: o servidor é a autoridade (ADR-0002). O client envia intenções
 * e apenas reproduz snapshots/eventos confirmados.
 */
export class OnlineDriver implements Driver {
  readonly mode = 'online' as const;
  private ws: WebSocket | null = null;
  private handlers: DriverHandlers | null = null;
  private sessionId: string | null = null;
  private closedByUs = false;

  async start(handlers: DriverHandlers): Promise<void> {
    this.handlers = handlers;
    this.sessionId = localStorage.getItem(SESSION_KEY);
    if (!this.sessionId) {
      const res = await fetch('/api/session', { method: 'POST' });
      if (!res.ok) throw new Error(`session HTTP ${res.status}`);
      const body = (await res.json()) as { sessionId: string };
      this.sessionId = body.sessionId;
      localStorage.setItem(SESSION_KEY, this.sessionId);
    }
    await this.connect();
  }

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${location.host}/ws`);
      this.ws = ws;
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('ws timeout'));
      }, 4000);
      ws.onopen = () => {
        clearTimeout(timeout);
        ws.send(JSON.stringify({ v: CONTRACT_VERSION, t: 'hello', sessionId: this.sessionId }));
        this.handlers?.onMode('online');
        resolve();
      };
      ws.onmessage = (msg) => {
        const data = JSON.parse(String(msg.data)) as ServerStateMsg | ServerErrorMsg;
        if (data.t === 'state') {
          this.handlers?.onState(data.state);
          if (data.events.length) this.handlers?.onEvents(data.events);
        } else if (data.t === 'error') {
          this.handlers?.onError(data.code, data.message);
        }
      };
      ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('ws error'));
      };
      ws.onclose = () => {
        clearTimeout(timeout);
        if (!this.closedByUs) this.handlers?.onMode('online', 'conexão perdida');
      };
    });
  }

  intent(intent: UiIntent): void {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      this.handlers?.onError('OFFLINE', 'sem conexão com o servidor');
      return;
    }
    const actionId = newActionId();
    const base = { v: CONTRACT_VERSION, actionId };
    switch (intent.t) {
      case 'click':
        ws.send(JSON.stringify({ ...base, t: 'click', clientTs: Date.now() }));
        break;
      case 'buy':
        ws.send(JSON.stringify({ ...base, t: 'buy', upgradeId: intent.upgradeId }));
        break;
      case 'unlockMine':
        ws.send(JSON.stringify({ ...base, t: 'unlockMine', mineId: intent.mineId }));
        break;
      case 'upgradeMine':
        ws.send(JSON.stringify({ ...base, t: 'upgradeMine', mineId: intent.mineId }));
        break;
      case 'bossRetry':
        ws.send(JSON.stringify({ ...base, t: 'bossRetry' }));
        break;
      case 'setAuto':
        ws.send(JSON.stringify({ v: CONTRACT_VERSION, t: 'setAuto', on: intent.on }));
        break;
      case 'setSpeed':
        ws.send(JSON.stringify({ v: CONTRACT_VERSION, t: 'setSpeed', mult: intent.mult }));
        break;
      case 'ackOffline':
        ws.send(JSON.stringify({ v: CONTRACT_VERSION, t: 'ackOffline' }));
        break;
    }
  }

  stop(): void {
    this.closedByUs = true;
    this.ws?.close();
  }
}

export type { DriverHandlers };
