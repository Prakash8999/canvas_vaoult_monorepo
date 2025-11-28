import Dexie, { Table } from 'dexie';
import { OutputData } from '@editorjs/editorjs';

// TypeScript types
export type NoteRecord = {
  id: string; // uuid
  title: string;
  content: OutputData; // EditorJS OutputData
  tags: string[]; // extracted tags
  backlinks: string[]; // extracted backlinks
  pinned?: boolean;
  version?: number; // incrementing per server-confirmed save
  updatedAt: string; // ISO
  meta?: Record<string, any>;
};

export type OutboxEvent = {
  id: string; // uuid
  type: 'note.create' | 'note.update' | 'note.patch' | 'note.delete' | 'version.save' | 'canvas.update' | 'attachment.upload';
  resourceId: string; // noteId or canvasId
  payload: any; // minimal delta or full snapshot
  createdAt: string; // ISO
  clientId: string; // device id
  opSeq?: number; // strictly increasing on client
};

export type MetaRecord = {
  key: string;
  value: any;
};

// Dexie DB schema
class CanvasVaultDB extends Dexie {
  notes!: Table<NoteRecord>;
  outbox!: Table<OutboxEvent>;
  meta!: Table<MetaRecord>;

  constructor() {
    super('canvasvault_db');
    this.version(1).stores({
      notes: 'id, updatedAt, version',
      outbox: 'id, createdAt, type',
      meta: 'key',
    });
  }
}

export const db = new CanvasVaultDB();

// Safe wrappers with transactions
export async function getAllNotes(): Promise<NoteRecord[]> {
  return await db.notes.toArray();
}

export async function getNote(id: string): Promise<NoteRecord | undefined> {
  return await db.notes.get(id);
}

export async function putNote(record: NoteRecord): Promise<void> {
  await db.notes.put(record);
}

export async function bulkPutNotes(records: NoteRecord[]): Promise<void> {
  await db.notes.bulkPut(records);
}

export async function deleteNote(id: string): Promise<void> {
  await db.notes.delete(id);
}

export async function appendOutboxEvent(event: OutboxEvent): Promise<void> {
  // Auto-increment opSeq if missing
  if (event.opSeq === undefined) {
    const lastEvent = await db.outbox.orderBy('createdAt').reverse().first();
    event.opSeq = (lastEvent?.opSeq || 0) + 1;
  }
  await db.outbox.add(event);
}

export async function peekOutboxBatch(limit: number): Promise<OutboxEvent[]> {
  return await db.outbox.orderBy('createdAt').limit(limit).toArray();
}

export async function removeOutboxEvents(ids: string[]): Promise<void> {
  await db.outbox.where('id').anyOf(ids).delete();
}

export async function getMeta(key: string): Promise<any> {
  const record = await db.meta.get(key);
  return record?.value;
}

export async function setMeta(key: string, value: any): Promise<void> {
  await db.meta.put({ key, value });
}

// Transactional operations for multiple writes
export async function transactionalNoteOperation(operation: () => Promise<void>): Promise<void> {
  await db.transaction('rw', db.notes, operation);
}

export async function transactionalOutboxOperation(operation: () => Promise<void>): Promise<void> {
  await db.transaction('rw', db.outbox, operation);
}

export async function transactionalMixedOperation(operation: () => Promise<void>): Promise<void> {
  await db.transaction('rw', db.notes, db.outbox, operation);
}