'use server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { translateAuthError } from '@/lib/authErrors';

const ALLOWED_TYPES: EmailOtpType[] = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
];

function redirectLogin(message: string) {
  redirect(`/login?error=${encodeURIComponent(message)}`);
}

function safeNext(next: string): string {
  if (!next.startsWith('/')) return '/dashboard';
  if (next.startsWith('//') || next.startsWith('/\\')) return '/dashboard';
  return next;
}

export async function confirmEmail(formData: FormData) {
  const code = String(formData.get('code') ?? '');
  const token_hash = String(formData.get('token_hash') ?? '');
  const rawType = String(formData.get('type') ?? '');
  const next = String(formData.get('next') ?? '/dashboard');

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) redirectLogin(translateAuthError(error.message));
    redirect(safeNext(next));
  }

  if (!token_hash || !ALLOWED_TYPES.includes(rawType as EmailOtpType)) {
    redirectLogin('Bestätigungslink ungültig.');
  }

  const { error } = await supabase.auth.verifyOtp({
    type: rawType as EmailOtpType,
    token_hash,
  });

  if (error) {
    redirectLogin(translateAuthError(error.message));
  }

  redirect(safeNext(next));
}
