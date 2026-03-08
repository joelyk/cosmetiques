"use client";

import { MailCheck } from "lucide-react";
import { useState, useTransition } from "react";

import { createSupabaseBrowserAuthClient } from "@/lib/supabase-auth-browser";

export function EmailLoginForm({ nextPath }: { nextPath: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    const nextEmail = String(formData.get("email") ?? "").trim();

    startTransition(async () => {
      setError(null);
      setStatus(null);

      try {
        const supabase = createSupabaseBrowserAuthClient();
        const redirectUrl = new URL("/auth/callback", window.location.origin);
        redirectUrl.searchParams.set("next", nextPath);

        const { error: signInError } = await supabase.auth.signInWithOtp({
          email: nextEmail,
          options: {
            emailRedirectTo: redirectUrl.toString(),
          },
        });

        if (signInError) {
          setError(signInError.message);
          return;
        }

        setStatus(
          "Le lien de connexion a ete envoye. Ouvre ton email puis clique sur le lien pour entrer sur le site.",
        );
        setEmail(nextEmail);
      } catch {
        setError(
          "La connexion email n'est pas encore configuree. Verifie Supabase URL et anon key.",
        );
      }
    });
  };

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit(new FormData(event.currentTarget));
      }}
    >
      <label className="field">
        <span>Adresse email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="exemple@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {status ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {status}
        </p>
      ) : null}

      <button
        type="submit"
        className="btn-primary inline-flex items-center gap-2"
        disabled={isPending}
      >
        <MailCheck className="h-4 w-4" />
        {isPending ? "Envoi du lien..." : "Recevoir un lien par email"}
      </button>

      <p className="text-sm text-[color:var(--muted)]">
        Pas de mot de passe local. Le client recoit simplement un lien de
        connexion sur son email.
      </p>
    </form>
  );
}
