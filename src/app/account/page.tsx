import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";
import { AccountProfileForm } from "@/components/account/account-profile-form";
import { getAdminEntryPath } from "@/lib/admin-entry";
import { canAccessAdmin } from "@/lib/roles";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(getAdminEntryPath({ next: "/account" }));
  }

  const canOpenAdmin = canAccessAdmin(session.user.role);

  return (
    <div className="space-y-8">
      <section className="panel p-8 md:p-10">
        <p className="eyebrow">Compte</p>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold">
              Bonjour {session.user.name ?? "cliente"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[color:var(--muted)]">
              Cet espace permet de suivre la session, verifier l email, mettre
              a jour le nom affiche et retrouver rapidement les acces utiles.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {canOpenAdmin ? (
              <Link href="/admin" className="btn-secondary">
                Ouvrir l admin
              </Link>
            ) : null}
            <Link href="/catalog" className="chip">
              Retour au catalogue
            </Link>
          </div>
        </div>
      </section>

      <AccountProfileForm
        email={session.user.email}
        initialName={session.user.name}
        role={session.user.role}
        emailConfirmedAt={session.user.emailConfirmedAt}
        lastSignInAt={session.user.lastSignInAt}
      />

      <section className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Securite</p>
            <h2 className="mt-2 text-2xl font-semibold">Connexion et deconnexion</h2>
            <p className="mt-3 max-w-2xl text-sm text-[color:var(--muted)]">
              La connexion se fait par email avec un lien unique. Aucun mot de
              passe local n est stocke sur le site.
            </p>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="btn-primary">
              Se deconnecter
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
