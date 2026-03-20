import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { EmailLoginForm } from "@/components/auth/email-login-form";
import { getAdminEntryPath } from "@/lib/admin-entry";
import { env } from "@/lib/env";
import { canAccessAdmin } from "@/lib/roles";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type AdminAccessPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  invalid_link:
    "Le lien admin n est plus valide ou a deja ete utilise. Demande un nouveau lien.",
  missing_code: "Le lien admin est incomplet.",
};

export default async function AdminAccessPage({
  searchParams,
}: AdminAccessPageProps) {
  const session = await auth();
  const { error, next } = await searchParams;
  const safeNext = next?.startsWith("/") ? next : "/admin";

  if (session?.user && canAccessAdmin(session.user.role)) {
    redirect(safeNext);
  }

  return (
    <section className="mx-auto max-w-3xl panel p-8 md:p-10">
      <p className="eyebrow">Acces prive</p>
      <h1 className="mt-3 text-4xl font-semibold">Connexion reservee a l administration</h1>
      <p className="mt-4 max-w-2xl text-sm text-[color:var(--muted)]">
        Cette entree n est pas affichee sur la boutique publique. Seules les
        adresses email autorisees dans la configuration du site peuvent ouvrir
        le back-office.
      </p>

      {error ? (
        <div className="mt-8 rounded-[28px] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {errorMessages[error] ?? "Impossible de finaliser la connexion admin."}
        </div>
      ) : null}

      {env.hasSupabaseClient ? (
        <EmailLoginForm
          nextPath={safeNext}
          submitLabel="Recevoir mon lien admin"
          successMessage="Le lien admin a ete envoye. Ouvre ton email puis clique dessus pour acceder au back-office."
          helperText="Pas de mot de passe local. Le lien magique email est reserve a l equipe admin."
        />
      ) : (
        <div className="mt-8 rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          Configure NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
          pour activer l acces admin par email.
        </div>
      )}

      <div className="mt-8 rounded-[28px] border border-[color:var(--line)] bg-white p-5 text-sm text-[color:var(--muted)]">
        <p className="font-medium text-[color:var(--ink)]">Emails autorises</p>
        <p className="mt-2">
          <code className="rounded bg-[color:var(--card-soft)] px-2 py-1 text-[color:var(--ink)]">
            SUPER_ADMIN_EMAILS
          </code>{" "}
          donne acces au tableau de bord complet.{" "}
          <code className="rounded bg-[color:var(--card-soft)] px-2 py-1 text-[color:var(--ink)]">
            ADMIN_EMAILS
          </code>{" "}
          donne acces au pilotage catalogue, ventes et analytics.
        </p>
      </div>

      <p className="mt-6 text-sm text-[color:var(--muted)]">
        Lien prive admin: <code>{getAdminEntryPath()}</code>
      </p>
    </section>
  );
}
