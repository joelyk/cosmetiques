"use client";

import { Settings2, Save } from "lucide-react";
import { useState, useTransition } from "react";

import type { StoreSettings } from "@/types/catalog";

const STORAGE_KEY = "josy-cosmetics-admin-store-settings";

export function StoreSettingsPanel({
  initialSettings,
  sharedEnabled,
  source,
}: {
  initialSettings: StoreSettings;
  sharedEnabled: boolean;
  source: "env" | "supabase";
}) {
  const [draft, setDraft] = useState<StoreSettings>(() => {
    if (typeof window === "undefined" || sharedEnabled) {
      return initialSettings;
    }

    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return initialSettings;
    }

    try {
      const parsed = JSON.parse(rawValue) as StoreSettings;
      if (parsed.storeName && parsed.whatsappOrderNumber) {
        return parsed;
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    return initialSettings;
  });
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateField = <Key extends keyof StoreSettings>(
    field: Key,
    value: StoreSettings[Key],
  ) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!sharedEnabled) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      setStatus(
        "Brouillon local sauvegarde dans ce navigateur admin. Active Supabase pour appliquer ces reglages sur le site public.",
      );
      return;
    }

    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(draft),
    });

    const payload = (await response.json()) as {
      error?: string;
    };

    if (!response.ok) {
      setStatus(payload.error ?? "Impossible de sauvegarder les reglages boutique.");
      return;
    }

    setStatus("Reglages boutique sauvegardes et appliques au tunnel de commande.");
  };

  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Reglages boutique</p>
          <h2 className="mt-2 text-2xl font-semibold">
            WhatsApp de vente et messages client
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-[color:var(--muted)]">
            Ce bloc permet de changer le numero WhatsApp officiel, le texte du
            checkout et le message de confiance affiche aux clientes.
          </p>
          <p className="mt-3 rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-[color:var(--muted)]">
            Source actuelle: {source === "supabase" ? "reglages partages Supabase" : "valeurs par defaut env"}.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2"
          disabled={isPending}
          onClick={() => startTransition(() => void handleSave())}
        >
          <Save className="h-4 w-4" />
          {isPending ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </div>

      {status ? (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {status}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <label className="field">
          <span>Nom de la boutique</span>
          <input
            value={draft.storeName}
            onChange={(event) => updateField("storeName", event.target.value)}
          />
        </label>

        <label className="field">
          <span>Numero WhatsApp officiel</span>
          <input
            value={draft.whatsappOrderNumber}
            onChange={(event) =>
              updateField("whatsappOrderNumber", event.target.value)
            }
            placeholder="237600000000"
          />
        </label>

        <label className="field">
          <span>Texte du bouton checkout</span>
          <input
            value={draft.whatsappButtonLabel}
            onChange={(event) =>
              updateField("whatsappButtonLabel", event.target.value)
            }
          />
        </label>

        <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-5 text-sm text-[color:var(--muted)]">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[color:var(--card-soft)] p-3">
              <Settings2 className="h-5 w-5 text-[color:var(--accent-strong)]" />
            </div>
            <div>
              <p className="font-medium text-[color:var(--ink)]">Impact direct</p>
              <p className="mt-1">
                Le nouveau numero et les nouveaux textes sont repris dans la page
                paiement et dans le lien WhatsApp genere cote serveur.
              </p>
            </div>
          </div>
        </div>

        <label className="field lg:col-span-2">
          <span>Description principale du checkout</span>
          <textarea
            rows={4}
            value={draft.checkoutDescription}
            onChange={(event) =>
              updateField("checkoutDescription", event.target.value)
            }
          />
        </label>

        <label className="field lg:col-span-2">
          <span>Message de confiance affiche au client</span>
          <textarea
            rows={4}
            value={draft.checkoutTrustNote}
            onChange={(event) =>
              updateField("checkoutTrustNote", event.target.value)
            }
          />
        </label>
      </div>
    </section>
  );
}
