"use client";

import { ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { getRoleLabel } from "@/lib/roles";
import { createSupabaseBrowserAuthClient } from "@/lib/supabase-auth-browser";
import type { UserRole } from "@/types/catalog";

type AccountProfileFormProps = {
  email: string | null;
  initialName: string | null;
  role: UserRole;
  emailConfirmedAt: string | null;
  lastSignInAt: string | null;
};

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Non disponible";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Non disponible";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export function AccountProfileForm({
  email,
  initialName,
  role,
  emailConfirmedAt,
  lastSignInAt,
}: AccountProfileFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialName ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      setStatus(null);
      setError(null);

      try {
        const supabase = createSupabaseBrowserAuthClient();
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            full_name: displayName.trim(),
            name: displayName.trim(),
          },
        });

        if (updateError) {
          setError(updateError.message);
          return;
        }

        setStatus("Profil mis a jour. La page va se rafraichir.");
        router.refresh();
      } catch {
        setError("Impossible de mettre a jour le profil pour le moment.");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[28px] border border-[color:var(--line)] bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-[color:var(--card-soft)] p-3">
            <UserRound className="h-5 w-5 text-[color:var(--accent-strong)]" />
          </div>
          <div>
            <p className="text-sm text-[color:var(--muted)]">Profil utilisateur</p>
            <h2 className="text-xl font-semibold">Identite du compte</h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="field sm:col-span-2">
            <span>Nom affiche</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Ex: Aissatou"
            />
          </label>
          <div className="field">
            <span>Email</span>
            <div className="rounded-[20px] border border-[color:var(--line)] bg-[color:var(--background)] px-4 py-3">
              {email ?? "Non disponible"}
            </div>
          </div>
          <div className="field">
            <span>Role</span>
            <div className="rounded-[20px] border border-[color:var(--line)] bg-[color:var(--background)] px-4 py-3 font-medium capitalize">
              {getRoleLabel(role)}
            </div>
          </div>
        </div>

        {status ? (
          <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {status}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          className="btn-primary mt-6"
          disabled={isPending}
          onClick={handleSave}
        >
          {isPending ? "Mise a jour..." : "Enregistrer le profil"}
        </button>
      </section>

      <section className="rounded-[28px] border border-[color:var(--line)] bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-[color:var(--card-soft)] p-3">
            <ShieldCheck className="h-5 w-5 text-[color:var(--accent-strong)]" />
          </div>
          <div>
            <p className="text-sm text-[color:var(--muted)]">Session</p>
            <h2 className="text-xl font-semibold">Etat de connexion</h2>
          </div>
        </div>

        <div className="mt-6 space-y-4 text-sm">
          <div className="rounded-[22px] border border-[color:var(--line)] bg-[color:var(--background)] px-4 py-4">
            <p className="text-[color:var(--muted)]">Email confirme</p>
            <p className="mt-2 font-medium">{formatDateTime(emailConfirmedAt)}</p>
          </div>
          <div className="rounded-[22px] border border-[color:var(--line)] bg-[color:var(--background)] px-4 py-4">
            <p className="text-[color:var(--muted)]">Derniere connexion</p>
            <p className="mt-2 font-medium">{formatDateTime(lastSignInAt)}</p>
          </div>
          <div className="rounded-[22px] border border-[color:var(--line)] bg-[color:var(--background)] px-4 py-4">
            <p className="text-[color:var(--muted)]">Methode</p>
            <p className="mt-2 font-medium">
              Lien magique par email via Supabase Auth
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
