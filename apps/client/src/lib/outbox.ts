import { appendOutboxEvent, peekOutboxBatch, removeOutboxEvents, transactionalOutboxOperation, OutboxEvent } from './dexieClient';

// Helper functions for outbox management
export async function addNoteCreateEvent(noteId: string, payload: any, clientId: string): Promise<void> {
  const event: OutboxEvent = {
    id: crypto.randomUUID(),
    type: 'note.create',
    resourceId: noteId,
    payload,
    createdAt: new Date().toISOString(),
    clientId,
  };
  await appendOutboxEvent(event);
}

export async function addNoteUpdateEvent(noteId: string, payload: any, clientId: string): Promise<void> {
  const event: OutboxEvent = {
    id: crypto.randomUUID(),
    type: 'note.update',
    resourceId: noteId,
    payload,
    createdAt: new Date().toISOString(),
    clientId,
  };
  await appendOutboxEvent(event);
}

export async function addNoteDeleteEvent(noteId: string, payload: any, clientId: string): Promise<void> {
  const event: OutboxEvent = {
    id: crypto.randomUUID(),
    type: 'note.delete',
    resourceId: noteId,
    payload,
    createdAt: new Date().toISOString(),
    clientId,
  };
  await appendOutboxEvent(event);
}

export async function addCanvasUpdateEvent(canvasId: string, payload: any, clientId: string): Promise<void> {
  const event: OutboxEvent = {
    id: crypto.randomUUID(),
    type: 'canvas.update',
    resourceId: canvasId,
    payload,
    createdAt: new Date().toISOString(),
    clientId,
  };
  await appendOutboxEvent(event);
}

export async function getPendingEvents(limit: number = 50): Promise<OutboxEvent[]> {
  return await peekOutboxBatch(limit);
}

export async function removeProcessedEvents(eventIds: string[]): Promise<void> {
  await removeOutboxEvents(eventIds);
}

export async function clearOutbox(): Promise<void> {
  await transactionalOutboxOperation(async () => {
    await removeOutboxEvents([]);
  });
}

// Utility to check if outbox has pending events
export async function hasPendingEvents(): Promise<boolean> {
  const events = await peekOutboxBatch(1);
  return events.length > 0;
}

// Get outbox statistics
export async function getOutboxStats(): Promise<{ count: number; oldestEvent?: string }> {
  const events = await peekOutboxBatch(1);
  if (events.length === 0) {
    return { count: 0 };
  }

  // Get total count (this is inefficient but for stats it's ok)
  const allEvents = await peekOutboxBatch(1000); // Assuming not too many
  return {
    count: allEvents.length,
    oldestEvent: events[0].createdAt,
  };
}