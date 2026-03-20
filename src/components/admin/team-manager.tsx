"use client";

import { Copy, MailPlus, Shield, ShieldOff } from "lucide-react";
import { useState, useTransition } from "react";

import type { AdminInvite, AdminTeamMember } from "@/types/catalog";

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Configuration fixe";
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

export function TeamManager({
  initialMembers,
  initialInvites,
  sharedEnabled,
}: {
  initialMembers: AdminTeamMember[];
  initialInvites: AdminInvite[];
  sharedEnabled: boolean;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [latestInviteUrl, setLatestInviteUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleInvite = async () => {
    setStatus(null);
    setLatestInviteUrl(null);

    const response = await fetch("/api/admin/team/invitations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const payload = (await response.json()) as {
      id?: string;
      error?: string;
      email?: string;
      inviteUrl?: string;
      expiresAt?: string;
    };

    if (
      !response.ok ||
      !payload.id ||
      !payload.inviteUrl ||
      !payload.email ||
      !payload.expiresAt
    ) {
      setStatus(payload.error ?? "Impossible de creer le lien d invitation admin.");
      return;
    }

    const nextInvite: AdminInvite = {
      id: payload.id,
      email: payload.email,
      role: "admin",
      status: "pending",
      invitedByEmail: null,
      createdAt: new Date().toISOString(),
      expiresAt: payload.expiresAt,
      inviteUrl: payload.inviteUrl,
    };

    setInvites((current) => [
      nextInvite,
      ...current.filter((entry) => entry.email !== payload.email),
    ]);
    setLatestInviteUrl(payload.inviteUrl);
    setStatus("Lien d invitation admin cree. Copie-le et partage-le a la personne invitee.");
    setEmail("");
  };

  const copyInviteUrl = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("Lien d invitation copie.");
    } catch {
      setStatus("Impossible de copier automatiquement. Copie le lien manuellement.");
    }
  };

  const revokeInvite = async (inviteId: string) => {
    setStatus(null);

    const response = await fetch("/api/admin/team/invitations", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inviteId }),
    });

    const payload = (await response.json()) as {
      error?: string;
    };

    if (!response.ok) {
      setStatus(payload.error ?? "Impossible de revoquer cette invitation.");
      return;
    }

    setInvites((current) => current.filter((entry) => entry.id !== inviteId));
    setStatus("Invitation admin revoquee.");
  };

  const revokeMember = async (memberEmail: string) => {
    setStatus(null);

    const response = await fetch("/api/admin/team/members", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: memberEmail }),
    });

    const payload = (await response.json()) as {
      error?: string;
    };

    if (!response.ok) {
      setStatus(payload.error ?? "Impossible de retirer cet admin.");
      return;
    }

    setMembers((current) => current.filter((entry) => entry.email !== memberEmail));
    setStatus("Acces admin retire.");
  };

  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Equipe admin</p>
          <h2 className="mt-2 text-2xl font-semibold">
            Inviter, copier le lien et retirer un acces
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-[color:var(--muted)]">
            Le super admin peut creer un lien d invitation reserve a une adresse
            email precise. Une fois le lien valide, le nouvel admin accede au
            back-office et peut gerer les produits, promotions, images et autres
            operations CRUD du site.
          </p>
        </div>
        <span className="chip">
          Invitations partagees: {sharedEnabled ? "actives" : "indisponibles"}
        </span>
      </div>

      {!sharedEnabled ? (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Configure Supabase admin et execute le SQL mis a jour pour activer les
          invitations dynamiques.
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-5">
            <p className="text-sm font-medium text-[color:var(--ink)]">
              Creer une invitation admin
            </p>
            <div className="mt-4 space-y-4">
              <label className="field">
                <span>Email a inviter</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@exemple.com"
                />
              </label>

              <button
                type="button"
                className="btn-primary inline-flex items-center gap-2"
                disabled={isPending || !sharedEnabled}
                onClick={() => startTransition(() => void handleInvite())}
              >
                <MailPlus className="h-4 w-4" />
                {isPending ? "Creation..." : "Generer le lien admin"}
              </button>
            </div>
          </div>

          {latestInviteUrl ? (
            <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-5">
              <p className="text-sm font-medium text-[color:var(--ink)]">
                Dernier lien genere
              </p>
              <p className="mt-3 break-all text-sm text-[color:var(--muted)]">
                {latestInviteUrl}
              </p>
              <button
                type="button"
                className="chip mt-4 inline-flex items-center gap-2"
                onClick={() => void copyInviteUrl(latestInviteUrl)}
              >
                <Copy className="h-4 w-4" />
                Copier le lien
              </button>
            </div>
          ) : null}

          {status ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {status}
            </p>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-5">
            <p className="text-sm font-medium text-[color:var(--ink)]">
              Admins actifs
            </p>
            <div className="mt-4 space-y-3">
              {members.map((member) => (
                <div
                  key={member.email}
                  className="rounded-[22px] border border-[color:var(--line)] bg-[color:var(--background)] px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{member.email}</p>
                      <p className="mt-1 text-sm text-[color:var(--muted)]">
                        Role: {member.role === "super_admin" ? "super admin" : "admin"}
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--muted)]">
                        Source:{" "}
                        {member.source === "env_super_admin"
                          ? "configuration super admin"
                          : member.source === "env_admin"
                            ? "configuration admin"
                            : "invitation acceptee"}
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--muted)]">
                        Creation: {formatDateTime(member.createdAt)}
                      </p>
                    </div>

                    {member.canRevoke ? (
                      <button
                        type="button"
                        className="chip inline-flex items-center gap-2"
                        onClick={() => void revokeMember(member.email)}
                      >
                        <ShieldOff className="h-4 w-4" />
                        Retirer l acces
                      </button>
                    ) : (
                      <span className="chip inline-flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Acces fixe
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-5">
            <p className="text-sm font-medium text-[color:var(--ink)]">
              Invitations en attente
            </p>
            <div className="mt-4 space-y-3">
              {invites.length === 0 ? (
                <p className="text-sm text-[color:var(--muted)]">
                  Aucune invitation admin en attente.
                </p>
              ) : (
                invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="rounded-[22px] border border-[color:var(--line)] bg-[color:var(--background)] px-4 py-4"
                  >
                    <p className="font-medium">{invite.email}</p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      Expire le {formatDateTime(invite.expiresAt)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="chip inline-flex items-center gap-2"
                        onClick={() => void copyInviteUrl(invite.inviteUrl)}
                      >
                        <Copy className="h-4 w-4" />
                        Copier le lien
                      </button>
                      <button
                        type="button"
                        className="chip inline-flex items-center gap-2"
                        onClick={() => void revokeInvite(invite.id)}
                      >
                        <ShieldOff className="h-4 w-4" />
                        Revoquer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
