import Link from 'next/link';
import { login } from '../actions';

type SearchParams = { error?: string; next?: string };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error, next } = await searchParams;

  return (
    <div className="rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-6 shadow-xl shadow-black/20">
      <h2 className="text-xl font-semibold text-slate-100 mb-1">Anmelden</h2>
      <p className="text-sm text-slate-400 mb-5">
        Willkommen zurück bei kanbanly.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs px-3 py-2">
          {error}
        </div>
      )}

      <form action={login} className="space-y-3">
        {next && <input type="hidden" name="next" value={next} />}
        <div>
          <label className="block text-xs text-slate-400 mb-1" htmlFor="email">
            E-Mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60"
          />
        </div>
        <div>
          <label
            className="block text-xs text-slate-400 mb-1"
            htmlFor="password"
          >
            Passwort
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-violet-500/90 hover:bg-violet-400 text-white text-sm font-medium py-2 mt-2 transition-colors"
        >
          Anmelden
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-slate-400">
        Noch kein Konto?{' '}
        <Link
          href="/register"
          className="text-violet-300 hover:text-violet-200 font-medium"
        >
          Registrieren
        </Link>
      </p>
    </div>
  );
}
