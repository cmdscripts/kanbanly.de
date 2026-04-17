export type Update = {
  date: string;
  title: string;
  description: string;
};

export const updates: Update[] = [
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
      'Trello-Style: Workspaces enthalten Boards. Dashboard listet alle auf.',
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
      'Drag & Drop zwischen Spalten, Checklisten mit Fortschrittsbalken, Konfetti in "Done".',
  },
];
