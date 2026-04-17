import Link from 'next/link';

export const metadata = { title: 'Datenschutz — kanbanly' };

export default function DatenschutzPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/"
            className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-emerald-400 grid place-items-center font-bold text-white text-sm shadow-lg shadow-violet-500/20"
          >
            k
          </Link>
          <h1 className="text-2xl font-semibold text-slate-100">
            Datenschutzerklärung
          </h1>
        </div>

        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4 mb-6 text-rose-200 text-sm">
          <strong>Bitte ersetze diesen Text durch einen generierten.</strong>{' '}
          Datenschutztexte sind rechtsverbindlich — nutze den kostenlosen
          Generator unter{' '}
          <a
            href="https://datenschutz-generator.de"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-rose-100"
          >
            datenschutz-generator.de
          </a>{' '}
          und paste das Ergebnis hier rein.
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-6 text-sm text-slate-300">
          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">
              1. Verantwortlicher
            </h2>
            <p className="leading-relaxed">
              [VOR- UND NACHNAME]
              <br />
              [ADRESSE]
              <br />
              E-Mail: [KONTAKT-E-MAIL]
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">
              2. Verarbeitete Daten
            </h2>
            <p className="leading-relaxed">
              Beim Erstellen eines Kontos verarbeiten wir deine E-Mail-Adresse
              und ein gehashtes Passwort. Beim Nutzen der App werden
              Board-Inhalte (Titel, Karten, Listen, Checklisten) und
              technische Daten (Session-Cookies) verarbeitet.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">
              3. Zwecke und Rechtsgrundlagen
            </h2>
            <p className="leading-relaxed">
              Verarbeitung zur Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO):
              Bereitstellen der Kanban-Funktionen. Berechtigtes Interesse
              (Art. 6 Abs. 1 lit. f DSGVO): sicherer Betrieb der Plattform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">
              4. Auftragsverarbeiter
            </h2>
            <ul className="list-disc list-inside space-y-1 leading-relaxed">
              <li>
                <strong className="text-slate-200">Hosting:</strong> [DEIN
                VPS-ANBIETER], Serverstandort Deutschland
              </li>
              <li>
                <strong className="text-slate-200">
                  Authentifizierung und Datenbank:
                </strong>{' '}
                Supabase Inc., Region Frankfurt (EU)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">
              5. Cookies
            </h2>
            <p className="leading-relaxed">
              Wir setzen ausschließlich technisch notwendige Cookies für die
              Login-Session. Keine Analyse- oder Werbe-Cookies. Keine
              Drittanbieter-Tracker.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">
              6. Speicherdauer
            </h2>
            <p className="leading-relaxed">
              Kontodaten werden gespeichert, solange dein Konto besteht. Bei
              Löschung werden alle personenbezogenen Daten entfernt.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">
              7. Deine Rechte
            </h2>
            <p className="leading-relaxed">
              Du hast jederzeit das Recht auf Auskunft, Berichtigung, Löschung,
              Einschränkung der Verarbeitung, Datenübertragbarkeit und
              Widerspruch (Art. 15–21 DSGVO). Schreib uns an [KONTAKT-E-MAIL].
              Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde
              beschweren.
            </p>
          </section>

          <section className="pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 leading-relaxed">
              Dies ist nur ein grobes Skelett mit Platzhaltern — für eine
              vollständige, rechtssichere Datenschutzerklärung nutze bitte
              einen Generator.
            </p>
          </section>
        </div>

        <div className="mt-6">
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-slate-100"
          >
            ← Zurück
          </Link>
        </div>
      </div>
    </div>
  );
}
