import { promises as fs } from 'node:fs';
import path from 'node:path';
import { PlayerStateSchema } from '@akai/shared';

export interface PersistenceStore {
  load(sessionId: string): Promise<unknown | null>;
  save(sessionId: string, state: unknown): Promise<void>;
  list(): Promise<string[]>;
}

const SAFE_ID = /^[a-zA-Z0-9_-]{8,128}$/;

/**
 * FileStore de desenvolvimento (ADR-0003): um JSON por sessão, escrita
 * atômica (tmp + rename). Carga valida schema; arquivo inválido vai para
 * quarentena `*.corrupt-<ts>` e a sessão recomeça (nunca silencioso).
 */
export class FileStore implements PersistenceStore {
  constructor(private readonly dir: string) {}

  private fileFor(sessionId: string): string {
    if (!SAFE_ID.test(sessionId)) throw new Error(`INVALID_SESSION_ID:${sessionId.length}`);
    return path.join(this.dir, `${sessionId}.json`);
  }

  async load(sessionId: string): Promise<unknown | null> {
    const file = this.fileFor(sessionId);
    let raw: string;
    try {
      raw = await fs.readFile(file, 'utf8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      const result = PlayerStateSchema.safeParse(parsed);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    } catch (err) {
      const quarantine = `${file}.corrupt-${Date.now()}`;
      await fs.rename(file, quarantine).catch(() => undefined);
      console.error(
        JSON.stringify({ level: 'error', msg: 'save quarantined', sessionId, quarantine, reason: String(err) }),
      );
      return null;
    }
  }

  async save(sessionId: string, state: unknown): Promise<void> {
    const file = this.fileFor(sessionId);
    await fs.mkdir(this.dir, { recursive: true });
    const tmp = `${file}.tmp-${process.pid}`;
    await fs.writeFile(tmp, JSON.stringify(state), 'utf8');
    await fs.rename(tmp, file);
  }

  async list(): Promise<string[]> {
    try {
      const names = await fs.readdir(this.dir);
      return names.filter((n) => n.endsWith('.json')).map((n) => n.replace(/\.json$/, ''));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw err;
    }
  }
}
