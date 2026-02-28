import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?next=/account");
  }

  return (
    <section className="mx-auto max-w-3xl panel p-8 md:p-10">
      <p className="eyebrow">Compte</p>
      <h1 className="mt-3 text-4xl font-semibold">
        Bonjour {session.user.name ?? "cliente"}
      </h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-5">
          <p className="text-sm text-[color:var(--muted)]">Email</p>
          <p className="mt-2 font-medium">{session.user.email}</p>
        </div>
        <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-5">
          <p className="text-sm text-[color:var(--muted)]">Rôle</p>
          <p className="mt-2 font-medium">{session.user.role}</p>
        </div>
      </div>

      <form
        className="mt-8"
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button type="submit" className="btn-secondary">
          Déconnexion
        </button>
      </form>
    </section>
  );
}
