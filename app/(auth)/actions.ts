'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  translateAuthError,
  validateEmail,
  validatePassword,
  validateUsername,
} from '@/lib/authErrors';

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

function redirectLogin(message: string, next?: string) {
  const params = new URLSearchParams({ error: message });
  if (next) params.set('next', next);
  redirect(`/login?${params.toString()}`);
}

function safeNext(next: string): string {
  if (!next.startsWith('/')) return '/dashboard';
  if (next.startsWith('//') || next.startsWith('/\\')) return '/dashboard';
  return next;
}

function redirectRegister(message: string) {
  redirect(`/register?error=${encodeURIComponent(message)}`);
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next =
    String(formData.get('next') ?? '/dashboard') || '/dashboard';

  const emailError = validateEmail(email);
  if (emailError) redirectLogin(emailError, next);
  if (!password) redirectLogin('Bitte gib dein Passwort ein.', next);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirectLogin(translateAuthError(error.message), next);
  }
  redirect(safeNext(next));
}

export async function register(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const username = String(formData.get('username') ?? '').trim();

  const usernameError = validateUsername(username);
  if (usernameError) redirectRegister(usernameError);

  const emailError = validateEmail(email);
  if (emailError) redirectRegister(emailError);

  const passwordError = validatePassword(password);
  if (passwordError) redirectRegister(passwordError);

  const supabase = await createClient();

  const { data: taken } = await supabase.rpc('username_exists', {
    u: username,
  });
  if (taken) {
    redirectRegister(
      `Der Benutzername „${username}" ist schon vergeben. Wähl einen anderen.`
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: `${siteUrl()}/auth/confirm`,
    },
  });

  if (error) {
    redirectRegister(translateAuthError(error.message));
  }
  redirect('/register?sent=1');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
