import { useEffect, useRef, useState } from 'react';

/** How long a row stays highlighted; matches the CSS animation duration. */
const FLASH_MS = 2000;

export type FlashKind = 'new' | 'edit';

/**
 * Tracks which rows changed since the last render so the grid can flash them.
 *
 * Needed because rows arriving over Realtime are otherwise indistinguishable
 * from rows that were always there: a donation another counter records in the
 * middle of a sorted register simply appears, and an operator scanning for the
 * receipt they were told about has no idea which line is new.
 *
 * The first pass is deliberately silent. Flashing on mount would light up the
 * entire register every time the screen opens, which teaches operators to
 * ignore the highlight exactly when it starts meaning something.
 */
export function useRealtimeRowFlash<T extends { id: string; updatedAt?: string }>(
  rows: T[]
): Map<string, FlashKind> {
  const [flashes, setFlashes] = useState<Map<string, FlashKind>>(new Map());
  const seenRef = useRef<Map<string, string> | null>(null);
  // Held so every flash can be cancelled on unmount; a timer firing after the
  // grid is gone would set state on an unmounted component.
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const prevSeen = seenRef.current;
    const nextSeen = new Map<string, string>();
    rows.forEach(r => nextSeen.set(r.id, r.updatedAt ?? ''));
    seenRef.current = nextSeen;

    // First observation: record the baseline without flashing anything.
    if (prevSeen === null) return;

    const changed: Array<[string, FlashKind]> = [];
    rows.forEach(r => {
      if (!prevSeen.has(r.id)) {
        changed.push([r.id, 'new']);
      } else if (prevSeen.get(r.id) !== (r.updatedAt ?? '')) {
        changed.push([r.id, 'edit']);
      }
    });

    if (changed.length === 0) return;

    setFlashes(prev => {
      const next = new Map(prev);
      changed.forEach(([id, kind]) => next.set(id, kind));
      return next;
    });

    changed.forEach(([id]) => {
      // Restart rather than stack: a row edited twice in quick succession
      // should flash once from the latest change, not hold a stale highlight.
      const existing = timersRef.current.get(id);
      if (existing) clearTimeout(existing);

      timersRef.current.set(
        id,
        setTimeout(() => {
          timersRef.current.delete(id);
          setFlashes(prev => {
            if (!prev.has(id)) return prev;
            const next = new Map(prev);
            next.delete(id);
            return next;
          });
        }, FLASH_MS)
      );
    });
  }, [rows]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(t => clearTimeout(t));
      timers.clear();
    };
  }, []);

  return flashes;
}
