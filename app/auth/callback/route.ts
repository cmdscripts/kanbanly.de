import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

function siteBase() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

function safeNext(next: string): string {
  if (!next.startsWith('/')) return '/dashboard';
  if (next.startsWith('//') || next.startsWith('/\\')) return '/dashboard';
  return next;
}

export async function GET(request: NextRequest) {
  const t0 = Date.now();
  const base = siteBase();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next') ?? '/dashboard');
  const errorDescription = searchParams.get('error_description');

  console.log(
    '[auth/callback] start',
    JSON.stringify({ code: code?.slice(0, 8), hasError: !!errorDescription })
  );

  if (errorDescription) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(errorDescription)}`,
        base
      )
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=Kein+Code+empfangen', base)
    );
  }

  const store = await cookies();
  const allCookies = store.getAll();
  console.log(
    '[auth/callback] cookies',
    allCookies.map((c) => `${c.name}(len=${c.value.length})`).join(', ') || 'NONE'
  );

  let exchangeError: string | null = null;
  try {
    const supabase = await createClient();
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('exchange_timeout_12s')), 12_000)
    );
    const exchange = supabase.auth.exchangeCodeForSession(code);
    const result = (await Promise.race([exchange, timeout])) as Awaited<
      typeof exchange
    >;
    if (result.error) {
      exchangeError = result.error.message;
      console.log(
        '[auth/callback] exchange error',
        Date.now() - t0,
        'ms:',
        result.error.message
      );
    } else {
      console.log('[auth/callback] exchange ok', Date.now() - t0, 'ms');
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    exchangeError = msg;
    console.log(
      '[auth/callback] exchange threw',
      Date.now() - t0,
      'ms:',
      msg
    );
  }

  if (exchangeError) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(exchangeError)}`, base)
    );
  }

  const supabase2 = await createClient();
  const {
    data: { user },
  } = await supabase2.auth.getUser();

  if (user) {
    const { data: profile } = await supabase2
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();
    const hasUsername =
      !!(profile as { username?: string | null } | null)?.username;
    if (!hasUsername) {
      return NextResponse.redirect(
        new URL(`/register/username?next=${encodeURIComponent(next)}`, base)
      );
    }
  }

  console.log('[auth/callback] done redirect', Date.now() - t0, 'ms');
  return NextResponse.redirect(new URL(next, base));
}
