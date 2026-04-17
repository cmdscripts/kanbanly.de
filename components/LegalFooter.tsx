import Link from 'next/link';

export function LegalFooter() {
  return (
    <footer className="py-4 text-center text-[11px] text-slate-500 flex items-center justify-center gap-4">
      <Link href="/impressum" className="hover:text-slate-300">
        Impressum
      </Link>
      <span className="text-slate-700">·</span>
      <Link href="/datenschutz" className="hover:text-slate-300">
        Datenschutz
      </Link>
    </footer>
  );
}
