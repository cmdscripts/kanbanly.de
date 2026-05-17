'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { resetOnboarding } from '@/app/(app)/integrations/discord/[guildId]/actions';

type Props = {
  guildId: string;
  variant?: 'subtle' | 'primary';
};

export function BotOnboardingResetButton({
  guildId,
  variant = 'subtle',
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const res = await resetOnboarding(guildId);
      if (res.ok) router.refresh();
    });
  };

  const classes =
    variant === 'primary'
      ? 'inline-flex items-center gap-1.5 rounded-md bg-accent text-white px-3 py-1.5 text-[12px] font-semibold hover:bg-accent/90 disabled:opacity-50 transition-colors'
      : 'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 text-[11.5px] text-muted hover:text-fg hover:border-line-strong disabled:opacity-50 transition-colors';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={classes}
      title="Geführte Tour neu starten"
    >
      <span aria-hidden>🎓</span>
      Tour starten
    </button>
  );
}
