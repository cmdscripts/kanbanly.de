'use client';

import { useState, useTransition } from 'react';
import {
  saveBotCustomization,
  resetBotCustomization,
  type BotCustomization,
} from '@/app/(app)/integrations/discord/[guildId]/actions';
import { toast } from '@/store/toastStore';
import { confirm } from '@/store/confirmStore';
import { Button } from './ui/Button';
import { FormSection, FormRow } from './ui/FormSection';

type Props = {
  guildId: string;
  initial: BotCustomization;
  defaultBotName?: string;
  defaultAvatarUrl?: string | null;
};

export function BotCustomizationForm({
  guildId,
  initial,
  defaultBotName = 'Kanbanly Bot',
  defaultAvatarUrl = null,
}: Props) {
  const [nickname, setNickname] = useState(initial.nickname ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl ?? '');
  const [pending, startTransition] = useTransition();
  const [resetting, setResetting] = useState(false);

  const submit = () => {
    startTransition(async () => {
      const r = await saveBotCustomization(guildId, {
        nickname: nickname.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
      });
      if (r.ok) {
        toast.success(
          'Gespeichert',
          'Bot übernimmt die Änderung in wenigen Sekunden. Discord-Rate-Limit für Avatar: ~2/Stunde.',
        );
      } else {
        toast.error('Fehler', r.error);
      }
    });
  };

  const reset = async () => {
    const ok = await confirm({
      title: 'Customization zurücksetzen?',
      description:
        'Bot fällt zurück auf den globalen Namen und das globale Avatar.',
      confirmLabel: 'Zurücksetzen',
      danger: true,
    });
    if (!ok) return;
    setResetting(true);
    const r = await resetBotCustomization(guildId);
    setResetting(false);
    if (r.ok) {
      setNickname('');
      setAvatarUrl('');
      toast.success('Zurückgesetzt');
    } else {
      toast.error('Fehler', r.error);
    }
  };

  const previewName = nickname.trim() || defaultBotName;
  const previewAvatar = avatarUrl.trim() || defaultAvatarUrl || '';

  return (
    <div className="space-y-5">
      <FormSection
        title="Vorschau"
        description="So sieht der Bot in diesem Server aus, sobald die Änderung übernommen wurde."
      >
        <div className="flex items-center gap-3 rounded-lg border border-line bg-elev/30 px-3.5 py-2.5">
          {previewAvatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewAvatar}
              alt=""
              className="w-12 h-12 rounded-full object-cover bg-elev"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-elev border border-line flex items-center justify-center text-[18px] text-subtle">
              ?
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold text-fg truncate">
              {previewName}
              <span className="ml-1.5 inline-block rounded bg-[#5865f2] px-1 py-px text-[9px] font-bold uppercase text-white align-middle">
                Bot
              </span>
            </div>
            <div className="text-[11px] text-subtle">
              Nickname &amp; Avatar gelten nur in <strong>diesem</strong> Server.
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Custom Name"
        description="Der Bot zeigt diesen Namen in diesem Server statt seines globalen Namens."
      >
        <FormRow label="Nickname (max 32 Zeichen)" hint="Leer lassen → globaler Bot-Name wird verwendet.">
          <div className="relative">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 32))}
              placeholder={defaultBotName}
              className="w-full rounded-md bg-elev border border-line-strong px-3 py-2 text-sm text-fg placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
            />
            <span className="absolute right-2 bottom-2 text-[10px] text-subtle font-mono tabular-nums">
              {nickname.length}/32
            </span>
          </div>
        </FormRow>
      </FormSection>

      <FormSection
        title="Custom Avatar"
        description="Eigenes Profilbild pro Server. URL muss öffentlich erreichbar sein (PNG/JPG/GIF, max 256 KB)."
      >
        <FormRow label="Avatar-URL" hint="Leer lassen → globales Bot-Avatar wird verwendet.">
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.png"
            className="w-full rounded-md bg-elev border border-line-strong px-3 py-2 text-sm text-fg placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
          />
        </FormRow>
        <p className="text-[11px] text-subtle leading-relaxed">
          ⓘ Discord-Rate-Limit: Bot-Avatar kann nur etwa <strong>2× pro Stunde</strong> geändert werden.
          Ändere lieber nicht zu oft hintereinander, sonst lehnt Discord weitere Versuche ab.
        </p>
      </FormSection>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-line">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={reset}
          loading={resetting}
        >
          Auf Standard zurücksetzen
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={submit}
          loading={pending}
        >
          {pending ? 'Speichere…' : 'Speichern'}
        </Button>
      </div>

      {initial.updatedAt && (
        <p className="text-[11px] text-subtle text-right">
          Zuletzt geändert: {new Date(initial.updatedAt).toLocaleString('de-DE')}
        </p>
      )}
    </div>
  );
}
