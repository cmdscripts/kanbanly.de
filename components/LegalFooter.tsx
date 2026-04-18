import Link from 'next/link';

export function LegalFooter() {
  return (
    <footer className="py-4 text-center text-[11px] text-subtle flex items-center justify-center gap-4">
      <Link href="/impressum" className="hover:text-fg-soft">
        Impressum
      </Link>
      <span className="text-faint">·</span>
      <Link href="/datenschutz" className="hover:text-fg-soft">
        Datenschutz
      </Link>
    </footer>
  );
}
