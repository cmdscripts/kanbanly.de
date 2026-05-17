'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ONBOARDING_STEPS,
  getStepByKey,
  getStepIndex,
  type OnboardingValidationData,
} from '@/lib/onboardingSteps';
import {
  advanceOnboarding,
  dismissOnboarding,
} from '@/app/(app)/integrations/discord/[guildId]/actions';

type Props = {
  guildId: string;
  currentStepKey: string | null;
  completedSteps: Array<{ stepKey: string; status: 'completed' | 'skipped' }>;
  data: OnboardingValidationData;
};

export function BotOnboardingTour({
  guildId,
  currentStepKey,
  completedSteps,
  data,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [collapsed, setCollapsed] = useState(false);
  const [confirmDismiss, setConfirmDismiss] = useState(false);

  const step = useMemo(
    () => (currentStepKey ? getStepByKey(currentStepKey) : null),
    [currentStepKey],
  );

  // Beim Step-Wechsel: Tabs auf den Step-Tab schalten + nach oben scrollen.
  useEffect(() => {
    if (!step) return;
    window.dispatchEvent(
      new CustomEvent('kanbanly:tour-go', { detail: step.tabId }),
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  if (!step) return null;

  const stepIdx = getStepIndex(step.key);
  const totalSteps = ONBOARDING_STEPS.length;
  const isDone = step.validate(data);
  const canAdvance = isDone || step.optional === true;
  const completedCount = completedSteps.filter(
    (c) => c.status === 'completed',
  ).length;

  const handleNext = () => {
    startTransition(async () => {
      const outcome = isDone ? 'completed' : 'skipped';
      const res = await advanceOnboarding(guildId, step.key, outcome);
      if (res.ok) router.refresh();
    });
  };

  const handleSkip = () => {
    startTransition(async () => {
      const res = await advanceOnboarding(guildId, step.key, 'skipped');
      if (res.ok) router.refresh();
    });
  };

  const handleDismiss = () => {
    startTransition(async () => {
      const res = await dismissOnboarding(guildId);
      if (res.ok) router.refresh();
    });
  };

  if (collapsed) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2 rounded-full bg-accent text-white shadow-lg px-4 py-2.5 text-[13px] font-semibold hover:bg-accent/90 transition-all"
        >
          <span className="text-base leading-none">🎓</span>
          Tour fortsetzen ({stepIdx + 1}/{totalSteps})
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base leading-none">🎓</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Tour · Schritt {stepIdx + 1} von {totalSteps}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="rounded-md p-1 text-muted hover:bg-elev hover:text-fg transition-colors"
            aria-label="Tour minimieren"
            title="Minimieren"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden
            >
              <path d="M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 pt-3">
        <div className="h-1.5 rounded-full bg-elev overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${((stepIdx + 1) / totalSteps) * 100}%` }}
          />
        </div>
        <div className="mt-1.5 text-[10.5px] text-faint flex justify-between">
          <span>
            {completedCount} erledigt · {totalSteps - completedCount - 1} verbleibend
          </span>
          {step.optional && (
            <span className="text-muted">Optional</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <h3 className="text-[15px] font-bold text-fg leading-tight">
          {step.title}
        </h3>
        <p className="mt-1.5 text-[12.5px] text-muted leading-relaxed">
          {step.intro}
        </p>

        <div
          className={`mt-3 rounded-md border px-3 py-2.5 text-[12px] leading-relaxed ${
            isDone
              ? 'border-[var(--success)]/30 bg-[var(--success)]/10 text-fg'
              : 'border-line bg-elev text-fg-soft'
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5">
              {isDone ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-[var(--success)]"
                  aria-hidden
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-muted"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="9" />
                </svg>
              )}
            </span>
            <div>
              <div className="font-semibold mb-0.5">
                {isDone ? 'Erledigt!' : 'Was zu tun ist:'}
              </div>
              <div>{step.task}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="border-t border-line px-4 py-3">
        {confirmDismiss ? (
          <div className="space-y-2">
            <p className="text-[12px] text-muted">
              Tour wirklich beenden? Du kannst sie später wieder starten.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDismiss}
                disabled={isPending}
                className="flex-1 rounded-md bg-[var(--danger)] text-white px-3 py-1.5 text-[12.5px] font-semibold hover:bg-[var(--danger)]/90 disabled:opacity-50 transition-colors"
              >
                Ja, beenden
              </button>
              <button
                type="button"
                onClick={() => setConfirmDismiss(false)}
                disabled={isPending}
                className="flex-1 rounded-md border border-line bg-surface px-3 py-1.5 text-[12.5px] text-fg hover:bg-elev disabled:opacity-50 transition-colors"
              >
                Doch nicht
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNext}
              disabled={!canAdvance || isPending}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-semibold transition-colors ${
                canAdvance
                  ? 'bg-accent text-white hover:bg-accent/90'
                  : 'bg-elev text-faint cursor-not-allowed'
              } disabled:opacity-60`}
              title={!canAdvance ? 'Erledige zuerst die Pflicht-Aktion' : undefined}
            >
              {stepIdx === totalSteps - 1 ? 'Tour abschließen' : 'Weiter'}
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
            </button>
            {step.optional && !isDone && (
              <button
                type="button"
                onClick={handleSkip}
                disabled={isPending}
                className="rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-muted hover:text-fg hover:border-line-strong disabled:opacity-50 transition-colors"
              >
                Überspringen
              </button>
            )}
            <button
              type="button"
              onClick={() => setConfirmDismiss(true)}
              disabled={isPending}
              className="rounded-md p-2 text-faint hover:bg-elev hover:text-fg disabled:opacity-50 transition-colors"
              aria-label="Tour beenden"
              title="Tour beenden"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
