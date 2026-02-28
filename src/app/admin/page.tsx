import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import { ImageStudio } from "@/components/admin/image-studio";
import { ProductEditor } from "@/components/admin/product-editor";
import { PromotionsManager } from "@/components/admin/promotions-manager";
import { getDashboardData } from "@/lib/analytics-server";
import { getCatalogSnapshot } from "@/lib/catalog-server";
import { env } from "@/lib/env";
import { canAccessAdmin } from "@/lib/roles";

export default async function AdminPage() {
  const session = await auth();
  const role = session?.user?.role ?? "guest";

  if (!session?.user) {
    redirect("/login?next=/admin");
  }

  if (!canAccessAdmin(role)) {
    redirect("/account");
  }

  const catalogSnapshot = await getCatalogSnapshot();
  const dashboardData = await getDashboardData({
    products: catalogSnapshot.products,
    categories: catalogSnapshot.categories,
  });

  return (
    <div className="space-y-10">
      <section className="panel p-8">
        <p className="eyebrow">
          {role === "super_admin" ? "Super admin" : "Admin ventes"}
        </p>
        <h1 className="mt-3 text-4xl font-semibold">
          Tableau de bord Josy Cosmetics
        </h1>
        <p className="mt-4 max-w-3xl text-sm text-[color:var(--muted)]">
          Le super admin voit le trafic entrant et la sante globale du site. Le
          second admin peut piloter les performances produits, les offres et les
          visuels pour ameliorer les clics et les demandes WhatsApp.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="chip">
            Catalogue:{" "}
            {catalogSnapshot.source === "supabase"
              ? "partage via Supabase"
              : "fallback local Git"}
          </span>
          <span className="chip">
            Analytics:{" "}
            {dashboardData.source === "supabase" ? "live" : "mode exemple"}
          </span>
          <span className="chip">
            Edition partagee: {env.hasSupabaseAdmin ? "active" : "a configurer"}
          </span>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-5">
            <p className="text-sm text-[color:var(--muted)]">Visiteurs semaine</p>
            <p className="mt-3 text-3xl font-semibold">
              {dashboardData.summary.visitors}
            </p>
          </div>
          <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-5">
            <p className="text-sm text-[color:var(--muted)]">Clics produit</p>
            <p className="mt-3 text-3xl font-semibold">
              {dashboardData.summary.productClicks}
            </p>
          </div>
          <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-5">
            <p className="text-sm text-[color:var(--muted)]">Demandes checkout</p>
            <p className="mt-3 text-3xl font-semibold">
              {dashboardData.summary.checkoutRequests}
            </p>
          </div>
        </div>
      </section>

      <DashboardCharts
        traffic={dashboardData.traffic}
        performance={dashboardData.performance}
        role={role}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        {dashboardData.insights.map((insight) => (
          <article key={insight} className="panel p-5">
            <p className="eyebrow">Feedback actionnable</p>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
              {insight}
            </p>
          </article>
        ))}
      </section>

      <ProductEditor
        categories={catalogSnapshot.categories}
        products={catalogSnapshot.products}
        sharedEnabled={env.hasSupabaseAdmin}
        source={catalogSnapshot.source}
        role={role}
      />

      <PromotionsManager
        categories={catalogSnapshot.categories}
        products={catalogSnapshot.products}
        promotions={catalogSnapshot.promotions}
        sharedEnabled={env.hasSupabaseAdmin}
      />

      <ImageStudio />
    </div>
  );
}
