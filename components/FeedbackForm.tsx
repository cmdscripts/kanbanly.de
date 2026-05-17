'use client';

import { useRef, useState, useTransition } from 'react';
import {
  updateFeedbackConfig,
  sendTestFeedback,
} from '@/app/(app)/integrations/discord/[guildId]/actions';
import { TestSendButton } from './ui/TestSendButton';
import { toast } from '@/store/toastStore';
import { Switch } from './Switch';
import { Button } from './ui/Button';
import { ColorPicker } from './ui/ColorPicker';
import { FormSection, FormRow } from './ui/FormSection';
import { StatusPill, StatusBanner } from './ui/Status';

type Props = {
  guildId: string;
  channels: { id: string; name: string }[];
  initial: {
    enabled: boolean;
    channelId: string | null;
    useEmbed: boolean;
    embedColor: number | null;
    embedTitle: string;
    introMessage: string;
    footerText: string | null;
  };
};

const DEFAULT_TITLE = 'Neues Feedback';
const DEFAULT_INTRO =
  '{user} hat Feedback hinterlassen\n\n**Bewertung:** {stars} ({rating}/5)\n**Kommentar:**\n{comment}';

const PLACEHOLDERS: Array<{ token: string; label: string; sample: string }> = [
  { token: '{user}', label: 'Username', sample: 'AnnaM' },
  { token: '{mention}', label: 'Mention', sample: '@AnnaM' },
  { token: '{server}', label: 'Server', sample: 'Mein Server' },
  { token: '{stars}', label: 'Sterne', sample: '⭐⭐⭐⭐·' },
  { token: '{rating}', label: 'Zahl 1-5', sample: '4' },
  { token: '{comment}', label: 'Kommentar', sample: 'Tolles Modul, läuft rund!' },
];

function renderPreview(template: string): string {
  let out = template;
  for (const p of PLACEHOLDERS) out = out.replaceAll(p.token, p.sample);
  return out;
}

function renderInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="rounded bg-elev px-1 text-[0.85em]">$1</code>')
    .replace(/\n/g, '<br/>');
}

export function FeedbackForm({ guildId, channels, initial }: Props) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [channelId, setChannelId] = useState(initial.channelId ?? '');
  const [useEmbed, setUseEmbed] = useState(initial.useEmbed);
  const [embedTitle, setEmbedTitle] = useState(initial.embedTitle || DEFAULT_TITLE);
  const [introMessage, setIntroMessage] = useState(
    initial.introMessage || DEFAULT_INTRO,
  );
  const [footerText, setFooterText] = useState(initial.footerText ?? '');
  const [embedColor, setEmbedColor] = useState(
    initial.embedColor !== null
      ? '#' + initial.embedColor.toString(16).padStart(6, '0')
      : '#5865F2',
  );
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertPlaceholder(token: string) {
    const ta = textareaRef.current;
    if (!ta) {
      setIntroMessage((m) => m + token);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = introMessage.slice(0, start) + token + introMessage.slice(end);
    setIntroMessage(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + token.length, start + token.length);
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enabled && !channelId) {
      toast.error('Feedback-Channel nötig');
      return;
    }
    const fd = new FormData();
    if (enabled) fd.set('enabled', 'on');
    fd.set('channel_id', channelId);
    if (useEmbed) fd.set('use_embed', 'on');
    fd.set('embed_color', embedColor);
    fd.set('embed_title', embedTitle);
    fd.set('intro_message', introMessage);
    fd.set('footer_text', footerText);
    startTransition(async () => {
      const r = await updateFeedbackConfig(guildId, fd);
      if (r.ok) toast.success('Feedback-Einstellungen gespeichert');
      else toast.error('Speichern fehlgeschlagen', r.error);
    });
  }

  const previewHtml = renderInlineMarkdown(renderPreview(introMessage || ' '));
  const selectedChannel = channels.find((c) => c.id === channelId);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormSection
        title="Feedback-System"
        description="User starten mit /feedback, wählen 1-5 Sterne aus einem Dropdown und können optional einen Kommentar im Modal hinterlassen. Das Ergebnis landet im konfigurierten Channel."
        badge={
          <StatusPill kind={enabled ? 'success' : 'neutral'} dot>
            {enabled ? 'Aktiv' : 'Aus'}
          </StatusPill>
        }
        action={<Switch checked={enabled} onChange={setEnabled} ariaLabel="Feedback aktiv" />}
      >
        <div className={enabled ? 'space-y-4' : 'space-y-4 opacity-50 pointer-events-none'}>
          <StatusBanner kind="info">
            Ideal für Service-Bewertungen, Event-Feedback oder Bot-Verbesserungsvorschläge.
          </StatusBanner>

          <FormRow label="Feedback-Channel" hint="Hier landen alle Bewertungen" required>
            <select
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="w-full rounded-md bg-elev border border-line-strong px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
            >
              <option value="">— Channel wählen —</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.name}
                </option>
              ))}
            </select>
          </FormRow>

          <FormRow
            label="Nachricht-Template"
            hint="Markdown unterstützt. Platzhalter unten anklicken zum Einfügen."
            required
          >
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PLACEHOLDERS.map((p) => (
                <button
                  key={p.token}
                  type="button"
                  onClick={() => insertPlaceholder(p.token)}
                  className="rounded-md border border-line-strong bg-elev hover:bg-elev-hover hover:border-accent/60 px-2 py-1 text-[11px] font-mono text-fg-soft transition-all"
                  title={`Fügt ${p.token} ein → ${p.label}`}
                >
                  {p.token}
                  <span className="ml-1 text-subtle">· {p.label}</span>
                </button>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={introMessage}
              onChange={(e) => setIntroMessage(e.target.value.slice(0, 3500))}
              rows={6}
              className="w-full rounded-md bg-elev border border-line-strong px-3 py-2 text-sm text-fg font-mono focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent resize-y transition-all"
            />
            <div className="mt-1 flex items-center justify-end">
              <span className="text-[10px] text-subtle font-mono tabular-nums">
                {introMessage.length}/3500
              </span>
            </div>
          </FormRow>

          <div className="rounded-lg border border-line bg-elev/30 px-3.5 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[12.5px] text-fg-soft">
                Format:{' '}
                <span className="font-semibold text-fg">
                  {useEmbed ? 'Embed' : 'Plain-Text'}
                </span>
              </div>
              <Switch
                checked={useEmbed}
                onChange={setUseEmbed}
                size="sm"
                ariaLabel="Als Embed senden"
              />
            </div>
            {useEmbed && (
              <div className="mt-3 pt-3 border-t border-line/60 space-y-3">
                <div>
                  <div className="text-[11.5px] font-medium text-muted mb-1.5">
                    Embed-Titel
                  </div>
                  <input
                    type="text"
                    value={embedTitle}
                    onChange={(e) => setEmbedTitle(e.target.value.slice(0, 256))}
                    placeholder="Neues Feedback"
                    className="w-full rounded-md bg-elev border border-line-strong px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                  />
                </div>
                <div>
                  <div className="text-[11.5px] font-medium text-muted mb-1.5">
                    Embed-Farbe
                  </div>
                  <ColorPicker value={embedColor} onChange={setEmbedColor} />
                </div>
                <div>
                  <div className="text-[11.5px] font-medium text-muted mb-1.5">
                    Footer-Text
                  </div>
                  <input
                    type="text"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value.slice(0, 1024))}
                    placeholder="z.B. Mein Server · Feedback"
                    className="w-full rounded-md bg-elev border border-line-strong px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="text-[11.5px] font-medium text-muted mb-1.5">Vorschau</div>
            <div className="rounded-lg border border-line bg-elev/30 p-3.5">
              <div className="text-[11px] text-subtle mb-2">
                {selectedChannel ? `#${selectedChannel.name}` : '#kein-channel'} · Beispiel (4 Sterne)
              </div>
              <div className="flex gap-2.5">
                <div className="h-8 w-8 rounded-full bg-accent/20 grid place-items-center text-[11px] font-semibold text-accent shrink-0">
                  B
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-accent">Bot</span>
                    <span className="rounded bg-accent/20 px-1 text-[9px] font-semibold text-accent uppercase tracking-wide">
                      BOT
                    </span>
                    <span className="text-[10px] text-subtle">heute</span>
                  </div>
                  {useEmbed ? (
                    <div
                      className="mt-1 rounded border-l-4 bg-elev px-3 py-2"
                      style={{ borderLeftColor: embedColor }}
                    >
                      {embedTitle && (
                        <div className="text-sm font-semibold text-fg mb-1">
                          {embedTitle}
                        </div>
                      )}
                      <div
                        className="text-sm text-fg-soft break-words"
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />
                      {footerText && (
                        <div className="mt-2 text-[10.5px] text-subtle">{footerText}</div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="text-sm text-fg-soft break-words"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </FormSection>

      <div className="sticky bottom-0 -mx-5 -mb-5 px-5 py-3 bg-bg/80 backdrop-blur-sm border-t border-line flex items-center justify-end gap-2">
        <TestSendButton onSend={() => sendTestFeedback(guildId)} />
        <Button type="submit" loading={pending} variant="primary">
          {pending ? 'Speichern…' : 'Speichern'}
        </Button>
      </div>
    </form>
  );
}
