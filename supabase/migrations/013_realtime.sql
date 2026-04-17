-- Block 6: enable Supabase Realtime on board tables so clients can subscribe
-- to postgres_changes and reconcile state live.

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'lists',
      'cards',
      'tasks',
      'labels',
      'card_assignees',
      'card_labels'
    ])
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        t
      );
    end if;
  end loop;
end
$$;
