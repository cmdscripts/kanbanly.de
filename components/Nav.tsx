import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/(auth)/actions';
import { HelpMenu } from './HelpMenu';

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="px-6 py-3 border-b border-slate-800/60 backdrop-blur-sm flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-emerald-400 grid place-items-center font-bold text-white text-sm shadow-lg shadow-violet-500/20">
          k
        </div>
        <div>
          <h1 className="text-base font-semibold text-slate-100 tracking-tight leading-none group-hover:text-violet-200 transition-colors">
            kanbanly
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Flow first. Build fast.
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        {user && (
          <>
            <span className="text-xs text-slate-400 hidden sm:inline">
              {user.email}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg border border-slate-700 hover:border-slate-500 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-slate-100 text-xs px-3 py-1.5 transition-colors"
              >
                Abmelden
              </button>
            </form>
          </>
        )}
        <HelpMenu />
      </div>
    </header>
  );
}
