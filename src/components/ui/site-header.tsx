import Link from "next/link";

import { auth, signOut } from "@/auth";
import { CartPill } from "@/components/cart/cart-pill";
import { canAccessAdmin, getRoleLabel } from "@/lib/roles";

const navItems = [
  { href: "/", label: "Accueil" },
  { href: "/catalog", label: "Catalogue" },
  { href: "/checkout", label: "Paiement" },
];

export async function SiteHeader() {
  const session = await auth();
  const canOpenAdmin = canAccessAdmin(session?.user?.role ?? "guest");
  const roleLabel = session?.user ? getRoleLabel(session.user.role) : null;

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--line)] bg-[color:var(--background)]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 md:px-10">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex flex-col">
            <span className="font-display text-2xl font-semibold tracking-[0.08em]">
              JOSY
            </span>
            <span className="-mt-1 text-xs uppercase tracking-[0.35em] text-[color:var(--muted)]">
              Cosmetics
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm text-[color:var(--muted)] md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition hover:text-[color:var(--ink)]"
              >
                {item.label}
              </Link>
            ))}
            {canOpenAdmin ? (
              <Link href="/admin" className="transition hover:text-[color:var(--ink)]">
                Admin
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <CartPill />
          {session?.user ? (
            <>
              <Link
                href="/account"
                className="chip hidden items-center gap-2 md:inline-flex"
              >
                <span>{session.user.name ?? session.user.email}</span>
                {roleLabel ? (
                  <span className="rounded-full bg-[color:var(--card-soft)] px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">
                    {roleLabel}
                  </span>
                ) : null}
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className="btn-secondary">
                  Deconnexion
                </button>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
