import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";
import { env } from "@/lib/env";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const { next } = await searchParams;
  const safeNext = next?.startsWith("/") ? next : "/account";

  if (session?.user) {
    redirect(safeNext);
  }

  return (
    <section className="mx-auto max-w-3xl panel p-8 md:p-10">
      <p className="eyebrow">Connexion</p>
      <h1 className="mt-3 text-4xl font-semibold">Connexion simple via Google</h1>
      <p className="mt-4 max-w-2xl text-sm text-[color:var(--muted)]">
        Google est la solution gratuite la plus simple a operer ici. Les
        clients se connectent sans mot de passe local, et les deux
        administrateurs sont pilotes par liste emails autorises.
      </p>

      {env.hasGoogleAuth ? (
        <form
          className="mt-8"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: safeNext });
          }}
        >
          <button type="submit" className="btn-primary">
            Se connecter avec Google
          </button>
        </form>
      ) : (
        <div className="mt-8 rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          Configure `AUTH_SECRET`, `AUTH_GOOGLE_ID` et `AUTH_GOOGLE_SECRET`
          dans l environnement pour activer Google Auth.
        </div>
      )}

      <div className="mt-8 rounded-[28px] border border-[color:var(--line)] bg-white p-5 text-sm text-[color:var(--muted)]">
        <p className="font-medium text-[color:var(--ink)]">Acces administrateur</p>
        <p className="mt-2">
          `SUPER_ADMIN_EMAILS` donne acces au tableau de bord complet.
          `ADMIN_EMAILS` donne acces au pilotage catalogue et ventes.
        </p>
      </div>

      <Link href="/catalog" className="chip mt-6 inline-flex">
        Continuer sans connexion
      </Link>
    </section>
  );
}
