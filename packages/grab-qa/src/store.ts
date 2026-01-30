import type { Annotation, QASession } from './types';

const DEFAULT_STORAGE_KEY = 'qaflow-annotations';

export function getStorageKey(customKey?: string): string {
  return customKey || DEFAULT_STORAGE_KEY;
}

export function loadAnnotations(storageKey: string): Annotation[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];

    const data = JSON.parse(stored);
    return Array.isArray(data) ? data : [];
  } catch {
    console.warn('[QAFlow] Failed to load annotations from storage');
    return [];
  }
}

export function saveAnnotations(storageKey: string, annotations: Annotation[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(storageKey, JSON.stringify(annotations));
  } catch (error) {
    console.error('[QAFlow] Failed to save annotations:', error);
  }
}

export function loadSession(sessionId: string): QASession | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(`qaflow-session-${sessionId}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: QASession): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(`qaflow-session-${session.id}`, JSON.stringify(session));
  } catch (error) {
    console.error('[QAFlow] Failed to save session:', error);
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
