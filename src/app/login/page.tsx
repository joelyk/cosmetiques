import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { EmailLoginForm } from "@/components/auth/email-login-form";
import { env } from "@/lib/env";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  invalid_link:
    "Le lien email n'est plus valide ou a deja ete utilise. Demande un nouveau lien.",
  missing_code: "Le lien de connexion email est incomplet.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const { error, next } = await searchParams;
  const safeNext = next?.startsWith("/") ? next : "/account";

  if (session?.user) {
    redirect(safeNext);
  }

  return (
    <section className="mx-auto max-w-3xl panel p-8 md:p-10">
      <p className="eyebrow">Connexion</p>
      <h1 className="mt-3 text-4xl font-semibold">Connexion simple par email</h1>
      <p className="mt-4 max-w-2xl text-sm text-[color:var(--muted)]">
        Les clients se connectent avec un lien magique envoye par email. Aucun
        mot de passe local a memoriser, et les deux administrateurs gardent leur
        role via la liste d&apos;emails autorises.
      </p>

      {error ? (
        <div className="mt-8 rounded-[28px] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {errorMessages[error] ?? "Impossible de finaliser la connexion email."}
        </div>
      ) : null}

      {env.hasSupabaseClient ? (
        <EmailLoginForm nextPath={safeNext} />
      ) : (
        <div className="mt-8 rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          Configure `NEXT_PUBLIC_SUPABASE_URL` et
          `NEXT_PUBLIC_SUPABASE_ANON_KEY` pour activer la connexion email.
        </div>
      )}

      <div className="mt-8 rounded-[28px] border border-[color:var(--line)] bg-white p-5 text-sm text-[color:var(--muted)]">
        <p className="font-medium text-[color:var(--ink)]">Acces administrateur</p>
        <p className="mt-2">
          <code className="rounded bg-[color:var(--card-soft)] px-2 py-1 text-[color:var(--ink)]">
            SUPER_ADMIN_EMAILS
          </code>{" "}
          donne acces au tableau de bord complet.{" "}
          <code className="rounded bg-[color:var(--card-soft)] px-2 py-1 text-[color:var(--ink)]">
            ADMIN_EMAILS
          </code>{" "}
          donne acces au pilotage catalogue et ventes.
        </p>
      </div>

      <Link href="/catalog" className="chip mt-6 inline-flex">
        Continuer sans connexion
      </Link>
    </section>
  );
}
