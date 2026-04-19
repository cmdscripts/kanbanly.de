'use client';
import { useEffect, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import {
  getBoardWebhook,
  saveBoardWebhook,
  deleteBoardWebhook,
  testBoardWebhook,
} from '@/app/(app)/webhook-actions';
import { confirm } from '@/store/confirmStore';

type Props = {
  boardId: string;
  onClose: () => void;
};

const EVENT_LABELS: Record<string, string> = {
  card_created: 'Neue Karte',
  card_moved: 'Karte verschoben',
};

const AVAILABLE_EVENTS = ['card_created', 'card_moved'];

export function WebhooksDialog({ boardId, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [events, setEvents] = useState<string[]>(AVAILABLE_EVENTS);
  const [message, setMessage] = useState<
    { kind: 'ok' | 'err'; text: string } | null
  >(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const existing = await getBoardWebhook(boardId);
      if (cancelled) return;
      if (existing) {
        setUrl(existing.url);
        setEnabled(existing.enabled);
        setEvents(existing.events.length > 0 ? existing.events : AVAILABLE_EVENTS);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  if (!mounted) return null;

  const toggleEvent = (e: string) =>
    setEvents((cur) =>
      cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]
    );

  const save = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await saveBoardWebhook(boardId, url.trim(), enabled, events);
      if (res.ok) setMessage({ kind: 'ok', text: 'Gespeichert.' });
      else setMessage({ kind: 'err', text: res.error });
    });
  };

  const test = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await testBoardWebhook(boardId);
      if (res.ok)
        setMessage({ kind: 'ok', text: 'Test-Nachricht gesendet. Check Discord.' });
      else setMessage({ kind: 'err', text: res.error });
    });
  };

  const remove = async () => {
    const ok = await confirm({
      title: 'Webhook entfernen?',
      description: 'Ab sofort werden keine Board-Events mehr an Discord gesendet.',
      confirmLabel: 'Entfernen',
      danger: true,
    });
    if (!ok) return;
    setMessage(null);
    startTransition(async () => {
      const res = await deleteBoardWebhook(boardId);
      if (res.ok) {
        setUrl('');
        setEnabled(true);
        setEvents(AVAILABLE_EVENTS);
        setMessage({ kind: 'ok', text: 'Webhook entfernt.' });
      } else {
        setMessage({ kind: 'err', text: res.error });
      }
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-surface border border-line shadow-2xl">
        <div className="px-5 py-4 border-b border-line flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-fg">Discord-Webhook</h2>
            <p className="text-xs text-muted mt-0.5">
              Board-Events landen automatisch in deinem Discord-Channel.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="text-subtle hover:text-fg-soft text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="p-5 text-xs text-subtle">Lade…</div>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <label
                htmlFor="wh-url"
                className="block text-xs text-muted mb-1"
              >
                Webhook-URL
              </label>
              <input
                id="wh-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/…/…"
                className="w-full rounded-lg bg-elev/80 border border-line-strong px-3 py-1.5 text-xs font-mono text-fg placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent-hover/60"
              />
              <p className="text-[11px] text-subtle mt-1 leading-relaxed">
                In Discord: Channel → Einstellungen → Integrationen → Webhooks
                → „Neuer Webhook" → Name + Avatar → URL kopieren.
              </p>
            </div>

            <div>
              <p className="text-xs text-muted mb-1.5">Events</p>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_EVENTS.map((e) => (
                  <label
                    key={e}
                    className="inline-flex items-center gap-1.5 cursor-pointer rounded-md border border-line-strong bg-elev/60 px-2 py-1"
                  >
                    <input
                      type="checkbox"
                      checked={events.includes(e)}
                      onChange={() => toggleEvent(e)}
                      className="h-3.5 w-3.5 accent-accent"
                    />
                    <span className="text-[11px] text-fg-soft">
                      {EVENT_LABELS[e] ?? e}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              <span className="text-xs text-fg-soft">
                Aktiv (bei „aus" wird nichts gesendet, Einstellungen bleiben)
              </span>
            </label>

            {message && (
              <div
                className={`rounded-md text-xs px-3 py-2 border ${
                  message.kind === 'ok'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="rounded-lg bg-accent/90 hover:bg-accent-hover disabled:opacity-60 text-white text-xs font-medium px-3 py-2 transition-colors"
              >
                {pending ? 'Speichere…' : 'Speichern'}
              </button>
              <button
                type="button"
                onClick={test}
                disabled={pending || !url.trim()}
                className="rounded-lg border border-line-strong hover:border-fg-soft bg-elev/60 hover:bg-elev disabled:opacity-50 text-fg-soft hover:text-fg text-xs font-medium px-3 py-2 transition-colors"
              >
                Test senden
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className="rounded-lg text-xs text-muted hover:text-rose-600 dark:hover:text-rose-300 px-3 py-2 ml-auto disabled:opacity-50"
              >
                Webhook entfernen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
