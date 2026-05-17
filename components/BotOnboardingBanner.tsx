'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  startOnboarding,
  dismissOnboarding,
} from '@/app/(app)/integrations/discord/[guildId]/actions';

type Props = {
  guildId: string;
};

export function BotOnboardingBanner({ guildId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStart = () => {
    startTransition(async () => {
      const res = await startOnboarding(guildId);
      if (res.ok) router.refresh();
    });
  };

  const handleDismiss = () => {
    startTransition(async () => {
      const res = await dismissOnboarding(guildId);
      if (res.ok) router.refresh();
    });
  };

  return (
    <div className="mb-6 rounded-xl border border-line bg-gradient-to-br from-[var(--accent-soft,#5865F210)] to-surface p-5 relative overflow-hidden">
      <div className="absolute -top-8 -right-8 text-6xl opacity-10 select-none pointer-events-none">
        🎓
      </div>
      <div className="relative">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-flex items-center rounded-full bg-accent/15 text-accent px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider">
            Neu hier?
          </span>
        </div>
        <h2 className="text-lg font-bold text-fg leading-tight">
          Geführte Tour durchs Bot-Dashboard
        </h2>
        <p className="mt-1.5 text-[13px] text-muted leading-relaxed max-w-xl">
          In ~5 Minuten richten wir gemeinsam die wichtigsten Module ein —
          Begrüßung, Auto-Rollen, Logging und mehr. Du kannst jederzeit
          abbrechen oder einzelne Schritte überspringen.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleStart}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent text-white px-4 py-2 text-[13px] font-semibold hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
              aria-hidden
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
            Tour starten
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isPending}
            className="rounded-md border border-line bg-surface px-4 py-2 text-[13px] text-muted hover:text-fg hover:border-line-strong disabled:opacity-50 transition-colors"
          >
            Lieber selbst erkunden
          </button>
        </div>
      </div>
    </div>
  );
}
