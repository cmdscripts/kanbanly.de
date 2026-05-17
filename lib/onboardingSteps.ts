/**
 * Onboarding-Tour für das Bot-Dashboard.
 *
 * Eine kuratierte, sortierte Teilmenge der Module aus dem Guild-Settings-Page.
 * Pflicht-Schritte müssen via `validate()` als erledigt erkannt werden, bevor
 * der User weiterklicken kann. Optional-Schritte lassen sich überspringen,
 * ohne dass etwas konfiguriert sein muss.
 */

export type OnboardingValidationData = {
  welcome: { enabled: boolean; channelId: string | null };
  goodbye: { enabled: boolean; channelId: string | null };
  autoRoles: { enabled: boolean; roleIds: string[] };
  log: { channelId: string | null };
  level: { enabled: boolean };
  automod: { enabled: boolean };
  reactionRoleMessagesCount: number;
  verify: { enabled: boolean; channelId: string | null; roleId: string | null };
};

export type OnboardingStep = {
  /** Stabiler Key — wird in bot_onboarding_progress.step_key gespeichert. */
  key: string;
  /** Tab-ID im GuildSettingsTabs, zu der die Tour springt. */
  tabId: string;
  /** Überschrift im Tour-Panel. */
  title: string;
  /** Kurze Erklärung, was das Modul macht (2–3 Sätze). */
  intro: string;
  /** Konkrete Pflicht-Aktion für den User. */
  task: string;
  /** True = User kann den Schritt überspringen ohne Pflicht-Aktion. */
  optional?: boolean;
  /** Prüft, ob der Schritt als erledigt gilt. */
  validate: (data: OnboardingValidationData) => boolean;
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    key: 'welcome',
    tabId: 'welcome',
    title: 'Begrüßung neuer Mitglieder',
    intro:
      'Sobald jemand deinem Server beitritt, kann der Bot eine personalisierte Nachricht in einem Channel posten — optional zusätzlich per Direkt-Nachricht.',
    task: 'Aktiviere das Modul, wähle einen Begrüßungs-Channel und speichere.',
    validate: (d) => d.welcome.enabled && !!d.welcome.channelId,
  },
  {
    key: 'goodbye',
    tabId: 'goodbye',
    title: 'Verabschiedung',
    intro:
      'Wenn Mitglieder den Server verlassen (oder gekickt werden), kann der Bot eine kurze Abschieds-Nachricht posten — gut für Transparenz im Team.',
    task: 'Aktiviere das Modul und wähle einen Channel, oder überspringe diesen Schritt.',
    optional: true,
    validate: (d) => d.goodbye.enabled && !!d.goodbye.channelId,
  },
  {
    key: 'autoroles',
    tabId: 'autoroles',
    title: 'Auto-Rollen',
    intro:
      'Jedes neue Mitglied bekommt automatisch eine oder mehrere Rollen — typischerweise eine "Member"- oder "Unverifiziert"-Rolle.',
    task: 'Aktiviere Auto-Rollen und wähle mindestens eine Rolle.',
    validate: (d) => d.autoRoles.enabled && d.autoRoles.roleIds.length > 0,
  },
  {
    key: 'logging',
    tabId: 'logging',
    title: 'Audit-Log',
    intro:
      'Joins, Leaves, gelöschte und bearbeitete Nachrichten sowie Rollen-Änderungen werden in einem Log-Channel protokolliert. Wichtig für Moderation.',
    task: 'Wähle einen Log-Channel und entscheide, welche Events geloggt werden.',
    validate: (d) => !!d.log.channelId,
  },
  {
    key: 'automod',
    tabId: 'automod',
    title: 'AutoMod',
    intro:
      'Filter für Spam-Links, übermäßiges CAPS-LOCK, Mass-Mentions und eine Wort-Blacklist. Hält den Server sauber ohne ständige Mod-Eingriffe.',
    task: 'Aktiviere AutoMod und konfiguriere mindestens einen Filter — oder überspringen.',
    optional: true,
    validate: (d) => d.automod.enabled,
  },
  {
    key: 'levels',
    tabId: 'levels',
    title: 'Leveling',
    intro:
      'Mitglieder sammeln XP durch Aktivität und steigen in Levels auf. Optional mit Rollen-Rewards bei bestimmten Levels.',
    task: 'Aktiviere das Level-System — oder überspringen, falls nicht erwünscht.',
    optional: true,
    validate: (d) => d.level.enabled,
  },
  {
    key: 'verify',
    tabId: 'verify',
    title: 'Verifizierung',
    intro:
      'Button-Verify schützt vor Selfbots und Raid-Accounts: neue Mitglieder müssen einen Button klicken, um Zugriff auf den Server zu bekommen.',
    task: 'Wähle Channel + Verified-Rolle und aktiviere — oder überspringen.',
    optional: true,
    validate: (d) =>
      d.verify.enabled && !!d.verify.channelId && !!d.verify.roleId,
  },
  {
    key: 'reactionroles',
    tabId: 'reactionroles',
    title: 'Reaction-Rollen',
    intro:
      'Self-Service-Rollen: Mitglieder geben sich selbst Rollen via Reaktion, Button oder Dropdown. Perfekt für Pings, Interessen, Pronomen etc.',
    task: 'Erstelle mindestens eine Reaction-Roles-Nachricht — oder überspringen.',
    optional: true,
    validate: (d) => d.reactionRoleMessagesCount > 0,
  },
];

export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number]['key'];

export function getStepByKey(key: string): OnboardingStep | undefined {
  return ONBOARDING_STEPS.find((s) => s.key === key);
}

export function getNextStep(currentKey: string | null): OnboardingStep | null {
  if (!currentKey) return ONBOARDING_STEPS[0] ?? null;
  const idx = ONBOARDING_STEPS.findIndex((s) => s.key === currentKey);
  if (idx < 0 || idx >= ONBOARDING_STEPS.length - 1) return null;
  return ONBOARDING_STEPS[idx + 1];
}

export function getStepIndex(key: string | null): number {
  if (!key) return -1;
  return ONBOARDING_STEPS.findIndex((s) => s.key === key);
}
