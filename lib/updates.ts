export type Update = {
  date: string;
  title: string;
  description: string;
};

export const updates: Update[] = [
  {
    date: '2026-04-17',
    title: 'Labels & Fälligkeitsdaten',
    description:
      'Karten bekommen farbige Labels und ein Fällig-am — inkl. Tönen für überfällig, heute und bald.',
  },
  {
    date: '2026-04-17',
    title: 'Löschen mit Bestätigung',
    description:
      'Workspaces, Boards, Spalten, Karten und Labels per "⋯"-Menü löschen — mit sauberem Bestätigungsdialog.',
  },
  {
    date: '2026-04-17',
    title: 'Karten-Detail & Zuweisungen',
    description:
      'Vollbild-Modal mit Titel, Beschreibung, Checkliste und Zuweisung an Board-Mitglieder.',
  },
  {
    date: '2026-04-17',
    title: 'Einladungen per Link',
    description:
      'Board-Mitglieder können jetzt andere per Einladungs-Link hinzufügen — Rollen Viewer, Editor, Admin.',
  },
  {
    date: '2026-04-17',
    title: 'Workspaces & Boards',
    description:
      'Workspaces enthalten Boards. Das Dashboard listet alle auf.',
  },
  {
    date: '2026-04-16',
    title: 'Login-System',
    description: 'Konto mit E-Mail + Passwort, Bestätigung per E-Mail.',
  },
  {
    date: '2026-04-16',
    title: 'Kanban-Board online',
    description:
      'Drag & Drop zwischen Spalten, Checklisten mit Fortschrittsbalken.',
  },
];
