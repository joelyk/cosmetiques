import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[color:var(--line)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-3 md:px-10">
        <div>
          <p className="eyebrow">Josy Cosmetics</p>
          <p className="mt-3 max-w-sm text-sm text-[color:var(--muted)]">
            Boutique Next.js pensee pour lancer les parfums maintenant puis
            etendre facilement vers gels douche, laits corporels et coffrets.
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
            Fait par GeniusClassrooms
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
            Navigation
          </h2>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/">Accueil</Link>
            <Link href="/catalog">Catalogue</Link>
            <Link href="/cart">Panier</Link>
            <Link href="/login">Connexion</Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
            Paiement
          </h2>
          <p className="mt-3 text-sm text-[color:var(--muted)]">
            Mobile Money et Orange Money sont confirmes via WhatsApp officiel
            pour garder un tunnel leger et sans collecte bancaire sur le site.
          </p>
        </div>
      </div>
    </footer>
  );
}
