-- Block 16: Hintergrundbild pro Board. URL-basiert (Unsplash, eigener
-- Server, etc.). Wird für alle Board-Mitglieder identisch gerendert.

alter table public.boards
  add column if not exists background_url text;
