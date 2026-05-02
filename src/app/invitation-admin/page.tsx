import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { EmailLoginForm } from "@/components/auth/email-login-form";
import { acceptAdminInvite } from "@/lib/admin-team";
import { env } from "@/lib/env";
import { canAccessAdmin } from "@/lib/roles";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type InvitationPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

const getErrorMessage = (reason: string) => {
  switch (reason) {
    case "missing_token":
      return "Le lien d invitation admin est incomplet.";
    case "invalid":
      return "Ce lien d invitation admin est invalide.";
    case "expired":
      return "Ce lien d invitation admin a expire.";
    case "revoked":
      return "Ce lien d invitation admin a ete revoque.";
    case "already_accepted":
      return "Cette invitation admin a deja ete utilisee.";
    case "email_mismatch":
      return "Connecte-toi avec l email qui a ete invite pour activer cet acces admin.";
    case "missing_supabase":
      return "Supabase admin n est pas configure pour traiter cette invitation.";
    default:
      return "Impossible de finaliser cette invitation admin.";
  }
};

export default async function InvitationAdminPage({
  searchParams,
}: InvitationPageProps) {
  const { token } = await searchParams;
  const session = await auth();

  if (!token) {
    return (
      <section className="mx-auto max-w-3xl panel p-8 md:p-10">
        <p className="eyebrow">Invitation admin</p>
        <h1 className="mt-3 text-4xl font-semibold">Lien admin invalide</h1>
        <p className="mt-4 text-sm text-[color:var(--muted)]">
          Demande un nouveau lien au super admin.
        </p>
      </section>
    );
  }

  if (!session?.user) {
    return (
      <section className="mx-auto max-w-3xl panel p-8 md:p-10">
        <p className="eyebrow">Invitation admin</p>
        <h1 className="mt-3 text-4xl font-semibold">Activer mon acces admin</h1>
        <p className="mt-4 max-w-2xl text-sm text-[color:var(--muted)]">
          Ce lien prive donne acces au back-office uniquement a l email invite.
          Connecte-toi d abord par email pour verifier l invitation.
        </p>

        {env.hasSupabaseClient ? (
          <EmailLoginForm
            nextPath={`/invitation-admin?token=${encodeURIComponent(token)}`}
            submitLabel="Recevoir mon lien de verification"
            successMessage="Le lien de verification a ete envoye. Ouvre ton email puis reviens finaliser l invitation admin."
            helperText="Utilise exactement l adresse email qui a recu l invitation admin."
          />
        ) : (
          <div className="mt-8 rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            Configure NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
            pour activer les invitations admin par email.
          </div>
        )}
      </section>
    );
  }

  if (canAccessAdmin(session.user.role)) {
    redirect("/admin");
  }

  const result = await acceptAdminInvite({
    token,
    email: session.user.email,
  });

  if (result.ok) {
    redirect("/admin");
  }

  return (
    <section className="mx-auto max-w-3xl panel p-8 md:p-10">
      <p className="eyebrow">Invitation admin</p>
      <h1 className="mt-3 text-4xl font-semibold">Invitation non activee</h1>
      <p className="mt-4 max-w-2xl text-sm text-[color:var(--muted)]">
        {getErrorMessage(result.reason)}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin" className="btn-secondary">
          Aller au back-office
        </Link>
        <Link href="/" className="chip">
          Retour a la boutique
        </Link>
      </div>
    </section>
  );
}
