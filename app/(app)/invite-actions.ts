'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type CreateInviteResult =
  | { ok: true; token: string; url: string }
  | { ok: false; error: string };

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

export async function createInvite(
  _prev: CreateInviteResult | null,
  formData: FormData
): Promise<CreateInviteResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const role = String(formData.get('role') ?? 'editor');
  const board_id = String(formData.get('board_id') ?? '');

  if (!email || !board_id) {
    return { ok: false, error: 'E-Mail und Board-ID erforderlich.' };
  }
  if (!['viewer', 'editor', 'admin'].includes(role)) {
    return { ok: false, error: 'Ungültige Rolle.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Nicht angemeldet.' };

  const { data, error } = await supabase
    .from('invitations')
    .insert({ email, role, board_id, invited_by: user.id })
    .select('token')
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'Fehler beim Erstellen.' };
  }

  return {
    ok: true,
    token: data.token,
    url: `${siteUrl()}/invite/${data.token}`,
  };
}

export async function acceptInvite(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  if (!token) redirect('/login');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const { data, error } = await supabase.rpc('accept_invitation', { t: token });

  if (error) {
    redirect(
      `/invite/${token}?error=${encodeURIComponent(error.message)}`
    );
  }

  if (!data) redirect('/dashboard');

  const { data: board } = await supabase
    .from('boards')
    .select('slug')
    .eq('id', data)
    .maybeSingle();

  redirect(board?.slug ? `/boards/${board.slug}` : `/boards/${data}`);
}

export async function switchAccountForInvite(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
}
